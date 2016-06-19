# -*- coding: utf-8 -*-
from src import app

__author__ = "zebraxxl"


def main():
    # from werkzeug.contrib.profiler import ProfilerMiddleware
    # app.config["PROFILE"] = True
    # app.wsgi_app = ProfilerMiddleware(app.wsgi_app, restrictions=[30])

    app.run(host="0.0.0.0", debug=True)


if __name__ == "__main__":
    main()
