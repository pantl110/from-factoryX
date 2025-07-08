up:
	docker-compose up

build:
	docker-compose up --build

makemigrations:
	docker-compose run --rm backend sh -c "python manage.py makemigrations"

migrate:
	docker-compose run --rm backend sh -c "python manage.py migrate"

startapp:
	docker-compose run --rm backend sh -c "python manage.py startapp $(filter-out $@,$(MAKECMDGOALS))"

testapp:
	docker-compose run --rm backend sh -c "python manage.py test $(filter-out $@,$(MAKECMDGOALS))"

testfile:
	docker-compose run --rm backend sh -c "python manage.py test $(word 2,$(MAKECMDGOALS)).tests.$(word 3,$(MAKECMDGOALS))"

run:
	docker-compose run --rm backend sh -c "python manage.py $(filter-out $@,$(MAKECMDGOALS))"

# 해당 목표가 실제로 존재하지 않음을 Make에 알려주는 더미 규칙
%:
	@: