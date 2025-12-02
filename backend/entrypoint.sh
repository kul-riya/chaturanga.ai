#!/usr/bin/env bash
set -e

host="mysql"
port=3306
user="root"
pass="${MYSQL_ROOT_PASSWORD}"

echo "Waiting for MySQL at ${host}:${port} ..."

# Python loop to wait for MySQL using pymysql
python - <<PY
import time, sys
import pymysql
host = "${host}"
port = ${port}
user = "${user}"
passwd = "${pass}"
for i in range(120):
    try:
        conn = pymysql.connect(host=host, port=port, user=user, password=passwd, connect_timeout=5)
        conn.close()
        print("MySQL reachable")
        sys.exit(0)
    except Exception as e:
        print(".", end="", flush=True)
        time.sleep(1)
print("Timed out waiting for MySQL", file=sys.stderr)
sys.exit(1)
PY

echo "MySQL is up - initializing app."

exec gunicorn --bind 0.0.0.0:5000 wsgi:app --workers 2 --timeout 120

