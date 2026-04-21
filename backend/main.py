"""
Startup script: applies any missing schema changes directly via psycopg2,
then hands off to gunicorn. This runs before Django's ORM so it works even
when Django migrations haven't been recorded yet.
"""
import os
import psycopg2


def get_conn():
    database_url = os.getenv("DATABASE_URL", "")
    if not database_url:
        print("[startup] No DATABASE_URL — skipping direct schema patch.")
        return None
    try:
        conn = psycopg2.connect(database_url, sslmode="require", connect_timeout=10)
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"[startup] Could not connect to DB: {e}")
        return None


def apply_schema(conn):
    cur = conn.cursor()
    steps = [
        # task: required_hours
        "ALTER TABLE core_task ADD COLUMN IF NOT EXISTS required_hours NUMERIC(10,2) NOT NULL DEFAULT 0",
        # task: progress
        "ALTER TABLE core_task ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0",
        # task: drop is_completed (ignore if already gone)
        "ALTER TABLE core_task DROP COLUMN IF EXISTS is_completed",
        # worklog: task_id FK
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='core_worklog' AND column_name='task_id'
            ) THEN
                ALTER TABLE core_worklog
                    ADD COLUMN task_id BIGINT NULL
                    REFERENCES core_task(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
            END IF;
        END $$
        """,
        # index: drop old one if exists, create new one
        "DROP INDEX IF EXISTS core_task_assigne_72d350_idx",
        "CREATE INDEX IF NOT EXISTS core_task_assigne_72d350_idx ON core_task (assigned_to_id, progress)",
    ]

    for sql in steps:
        try:
            cur.execute(sql)
            print(f"[startup] OK: {sql.strip()[:80]}")
        except Exception as e:
            print(f"[startup] SKIP ({e}): {sql.strip()[:80]}")

    cur.close()


def main():
    conn = get_conn()
    if conn:
        apply_schema(conn)
        conn.close()
        print("[startup] Schema patch complete.")


if __name__ == "__main__":
    main()
