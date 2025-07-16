#!/usr/bin/env python3
"""
Test script for the Quote Extractor API
- Uploads files from the data directory to the API
- Displays the structured JSON response
"""

import json
from pathlib import Path
import asyncio
import aiohttp
import argparse

# Default API URL
DEFAULT_API_URL = "http://127.0.0.1:8000/v1/document/quotation/extract-quote"


async def test_file(file_path, api_url):
    """
    Test a single file with the API
    """
    print(f"\n{'=' * 60}")
    print(f"Testing file: {file_path}")
    print(f"{'=' * 60}")

    async with aiohttp.ClientSession() as session:
        with open(file_path, "rb") as f:
            file_content = f.read()

        form_data = aiohttp.FormData()
        form_data.add_field(
            "document",
            file_content,
            filename=Path(file_path).name,
            content_type="application/octet-stream",
        )

        try:
            async with session.post(api_url, data=form_data) as response:
                if response.status == 200:
                    result = await response.json()

                    # Pretty print the client info
                    print("\nClient Information:")
                    print("-" * 40)
                    for key, value in result["client_info"].items():
                        print(f"{key.replace('_', ' ').title()}: {value}")

                    # Pretty print the request items
                    print("\nRequest Items:")
                    print("-" * 40)
                    if result["request_items"]:
                        headers = [
                            "Item Name",
                            "Item Code",
                            "Spec",
                            "Unit",
                            "Quantity",
                            "Unit Price",
                        ]
                        print(
                            f"{headers[0]:<30} {headers[1]:<15} {headers[2]:<20} {headers[3]:<10} {headers[4]:<10} {headers[5]:<15}"
                        )
                        print("-" * 100)

                        for item in result["request_items"]:
                            print(
                                f"{item['item_name']:<30} {item['item_code']:<15} {item['spec']:<20} {item['unit']:<10} {item['quantity']:<10} {item['unit_price']:<15}"
                            )
                    else:
                        print("No request items found")

                    print("\nRaw JSON Response:")
                    print("-" * 40)
                    print(json.dumps(result, indent=2, ensure_ascii=False))

                    return True
                else:
                    error_text = await response.text()
                    print(f"\nError {response.status}: {error_text}")
                    return False

        except Exception as e:
            print(f"\nException during API request: {str(e)}")
            return False


async def test_directory(directory_path, api_url):
    """
    Test all files in a directory with the API
    """
    success_count = 0
    fail_count = 0

    # Get all PDF and image files
    files = []
    for ext in [".pdf", ".jpg", ".jpeg", ".png"]:
        files.extend(list(Path(directory_path).glob(f"*{ext}")))

    if not files:
        print(f"No supported files found in {directory_path}")
        return

    print(f"\nFound {len(files)} files to test")

    for file_path in files:
        success = await test_file(file_path, api_url)
        if success:
            success_count += 1
        else:
            fail_count += 1

    print(f"\n{'=' * 60}")
    print(f"Test Summary: {success_count} successful, {fail_count} failed")
    print(f"{'=' * 60}")


async def main():
    parser = argparse.ArgumentParser(description="Test the Quote Extractor API")
    parser.add_argument(
        "--api", default=DEFAULT_API_URL, help=f"API URL (default: {DEFAULT_API_URL})"
    )
    parser.add_argument("--file", help="Single file to test")
    parser.add_argument(
        "--dir",
        default="./data",
        help="Directory containing files to test (default: ./data)",
    )

    args = parser.parse_args()

    if args.file:
        # Test single file
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"Error: File {file_path} does not exist")
            return
        await test_file(file_path, args.api)
    else:
        # Test all files in directory
        dir_path = Path(args.dir)
        if not dir_path.exists() or not dir_path.is_dir():
            print(f"Error: Directory {dir_path} does not exist")
            return
        await test_directory(dir_path, args.api)


if __name__ == "__main__":
    asyncio.run(main())
