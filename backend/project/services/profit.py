"""수익 상세 집계 엔진.

- 매출: QuotationProduct.unit_price x quantity (주문 단가 기준)
- 자재원가: 실제 소모된 LOT의 구매 단가 기준 (MaterialUsage)
- 귀속 시점: 프로젝트 완료일(Project.completed_at)
- is_estimated: 소모 기록이 없어 BOM(MaterialProduct)으로 추정한 경우 True
"""

from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

from dateutil.relativedelta import relativedelta

from project.models import Project
from stock.models import MaterialHistory


def _to_int(value):
    return int(Decimal(value).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _rate(profit, revenue):
    if not revenue:
        return 0.0
    return round(profit / revenue * 100, 1)


def _month_str(d):
    return d.strftime("%Y-%m")


def _resolve_period(start, end):
    """start/end("YYYY-MM", 선택) -> (start_date, end_date, start_month, end_month)."""
    if end:
        ey, em = (int(x) for x in end.split("-"))
        end_month = date(ey, em, 1)
    else:
        end_month = date.today().replace(day=1)

    if start:
        sy, sm = (int(x) for x in start.split("-"))
        start_month = date(sy, sm, 1)
    else:
        start_month = end_month - relativedelta(months=4)

    start_date = start_month
    end_date = (end_month + relativedelta(months=1)) - timedelta(days=1)
    return start_date, end_date, start_month, end_month


def _latest_purchase_price(material_id, cache):
    if material_id in cache:
        return cache[material_id]
    history = (
        MaterialHistory.objects.filter(
            material_id=material_id,
            type=MaterialHistory.MaterialHistoryType.purchase,
            price__isnull=False,
        )
        .order_by("-created_at")
        .first()
    )
    price = history.price if history else 0
    cache[material_id] = price
    return price


def calc_plan_material_cost(plan, product=None, price_cache=None):
    """한 생산계획의 자재원가와 추정 여부를 반환한다. -> (Decimal, bool).

    - material_consumed=True: 실제 소모한 LOT 단가로 정확 계산
      (MaterialHistory.price 또는 소분 시 parent_history.price)
    - material_consumed=False: BOM x 수량 x 최근 구매단가로 추정 (is_estimated=True)
    """
    if price_cache is None:
        price_cache = {}

    if plan.material_consumed:
        cost = Decimal("0")
        estimated = False
        for usage in plan.material_usages.all():
            price = None
            if usage.material_history_id:
                price = usage.material_history.price
            elif (
                usage.material_repackaging_id
                and usage.material_repackaging.parent_history_id
            ):
                price = usage.material_repackaging.parent_history.price
            if price is None:
                estimated = True
                price = 0
            cost += (usage.usage_amount or Decimal("0")) * Decimal(price)
        return cost, estimated

    # BOM 폴백 (소모 기록 없음 -> 추정)
    if product is None:
        product = plan.product.product
    cost = Decimal("0")
    quantity = Decimal(plan.quantity or 0)
    for material_product in product.material_products.all():
        unit_price = _latest_purchase_price(material_product.material_id, price_cache)
        cost += (material_product.quantity or Decimal("0")) * quantity * Decimal(
            unit_price or 0
        )
    return cost, True


def _blank_acc():
    return {"revenue": 0, "material_cost": 0, "is_estimated": False}


def _blank_month():
    return {"acc": _blank_acc(), "clients": {}, "products": {}}


def _add_product(bucket, product, revenue, material_cost, estimated, quantity):
    entry = bucket.setdefault(
        product.id,
        {
            "product_id": product.id,
            "product_name": product.name,
            "quantity": 0,
            "acc": _blank_acc(),
        },
    )
    entry["quantity"] += int(quantity or 0)
    _add(entry["acc"], revenue, material_cost, estimated)


def _finalize_products(bucket):
    products = [
        _finalize(
            p["acc"],
            {
                "product_id": p["product_id"],
                "product_name": p["product_name"],
                "quantity": p["quantity"],
            },
        )
        for p in bucket.values()
    ]
    products.sort(key=lambda x: x["revenue"], reverse=True)
    return products


def _add(acc, revenue, material_cost, estimated):
    acc["revenue"] += revenue
    acc["material_cost"] += material_cost
    acc["is_estimated"] = acc["is_estimated"] or estimated


def _finalize(acc, extra=None):
    revenue = acc["revenue"]
    material_cost = acc["material_cost"]
    profit = revenue - material_cost
    result = {
        "revenue": revenue,
        "material_cost": material_cost,
        "profit": profit,
        "profit_rate": _rate(profit, revenue),
        "is_estimated": acc["is_estimated"],
    }
    if extra:
        result.update(extra)
    return result


def build_profit_detail(factory_id, start=None, end=None):
    factory_id = int(factory_id)
    start_date, end_date, start_month, end_month = _resolve_period(start, end)

    projects = (
        Project.objects.filter(
            quotations__factory_id=factory_id,
            status=Project.ProjectStatus.completed,
            completed_at__gte=start_date,
            completed_at__lte=end_date,
        )
        .distinct()
        .prefetch_related(
            "quotations__client",
            "quotations__products__product__material_products",
            "quotations__products__plans__material_usages__material_history",
            "quotations__products__plans__material_usages__material_repackaging__parent_history",
        )
    )

    price_cache = {}
    clients = {}
    # 선택 기간의 모든 달을 0으로 미리 채워 빈 달도 차트/표에 노출되게 한다.
    month_keys = []
    month_cursor = start_month
    while month_cursor <= end_month:
        month_keys.append(_month_str(month_cursor))
        month_cursor += relativedelta(months=1)
    months = {ym: _blank_month() for ym in month_keys}
    total_revenue = 0
    total_material_cost = 0
    total_estimated = False

    for project in projects:
        if not project.completed_at:
            continue
        ym = _month_str(project.completed_at)

        for quotation in project.quotations.all():
            if int(quotation.factory_id) != factory_id:
                continue
            client = quotation.client
            if client is None:
                continue

            for qp in quotation.products.all():
                revenue = int((qp.quantity or 0) * (qp.unit_price or 0))
                material_cost = Decimal("0")
                estimated = False
                for plan in qp.plans.all():
                    plan_cost, plan_est = calc_plan_material_cost(
                        plan, qp.product, price_cache
                    )
                    material_cost += plan_cost
                    estimated = estimated or plan_est
                material_cost = _to_int(material_cost)

                total_revenue += revenue
                total_material_cost += material_cost
                total_estimated = total_estimated or estimated

                product = qp.product
                quantity = qp.quantity or 0

                # 월별 (전체 + 그 달의 거래처별/제품별 분해)
                month_entry = months.setdefault(ym, _blank_month())
                _add(month_entry["acc"], revenue, material_cost, estimated)
                _add_product(
                    month_entry["products"],
                    product,
                    revenue,
                    material_cost,
                    estimated,
                    quantity,
                )
                month_client = month_entry["clients"].setdefault(
                    client.id,
                    {
                        "client_id": client.id,
                        "client_name": client.name,
                        "acc": _blank_acc(),
                        "products": {},
                    },
                )
                _add(month_client["acc"], revenue, material_cost, estimated)
                _add_product(
                    month_client["products"],
                    product,
                    revenue,
                    material_cost,
                    estimated,
                    quantity,
                )

                # 거래처별
                client_entry = clients.setdefault(
                    client.id,
                    {
                        "client_id": client.id,
                        "client_name": client.name,
                        "acc": _blank_acc(),
                        "products": {},
                        "monthly": {ym: _blank_acc() for ym in month_keys},
                    },
                )
                _add(client_entry["acc"], revenue, material_cost, estimated)

                # 거래처 - 제품별
                _add_product(
                    client_entry["products"],
                    product,
                    revenue,
                    material_cost,
                    estimated,
                    quantity,
                )

                # 거래처 - 월별
                _add(
                    client_entry["monthly"].setdefault(ym, _blank_acc()),
                    revenue,
                    material_cost,
                    estimated,
                )

    by_client = []
    for entry in clients.values():
        monthly = [
            _finalize(acc, {"month": ym}) for ym, acc in entry["monthly"].items()
        ]
        monthly.sort(key=lambda x: x["month"], reverse=True)

        by_client.append(
            _finalize(
                entry["acc"],
                {
                    "client_id": entry["client_id"],
                    "client_name": entry["client_name"],
                    "products": _finalize_products(entry["products"]),
                    "monthly": monthly,
                },
            )
        )
    by_client.sort(key=lambda x: x["revenue"], reverse=True)

    by_month = []
    for ym, entry in months.items():
        month_clients = [
            _finalize(
                c["acc"],
                {
                    "client_id": c["client_id"],
                    "client_name": c["client_name"],
                    "products": _finalize_products(c["products"]),
                },
            )
            for c in entry["clients"].values()
        ]
        month_clients.sort(key=lambda x: x["revenue"], reverse=True)

        by_month.append(
            _finalize(
                entry["acc"],
                {
                    "month": ym,
                    "clients": month_clients,
                    "products": _finalize_products(entry["products"]),
                },
            )
        )
    by_month.sort(key=lambda x: x["month"], reverse=True)

    total_profit = total_revenue - total_material_cost
    return {
        "period_start": _month_str(start_month),
        "period_end": _month_str(end_month),
        "total_revenue": total_revenue,
        "total_material_cost": total_material_cost,
        "total_profit": total_profit,
        "total_profit_rate": _rate(total_profit, total_revenue),
        "by_client": by_client,
        "by_month": by_month,
    }


def build_profit_detail_with_last_year(factory_id, start=None, end=None):
    result = build_profit_detail(factory_id, start, end)

    def _shift_year(ym):
        y, m = (int(x) for x in ym.split("-"))
        return (date(y, m, 1) - relativedelta(years=1)).strftime("%Y-%m")

    last_year = build_profit_detail(
        factory_id,
        _shift_year(result["period_start"]),
        _shift_year(result["period_end"]),
    )
    result["by_month_last_year"] = last_year["by_month"]
    return result
