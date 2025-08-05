#!/usr/bin/env python
"""
크론 작업 테스트 스크립트
"""
import os
import sys
import django

# Django 설정 로드
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cfehome.settings')
django.setup()

from project.management.commands.update_production_status import Command

if __name__ == '__main__':
    command = Command()
    command.handle() 