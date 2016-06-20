#!/usr/bin/env python
# -*- coding: utf-8 -*-
from src import app

__author__ = "zebraxxl"


def application(environ, start_response):
    return app(environ, start_response)
