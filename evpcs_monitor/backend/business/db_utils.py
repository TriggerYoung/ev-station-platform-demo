# db_utils.py
from utils.db_connetion import connect_to_db


def add_business_data(data):
    connection = connect_to_db()
    try:
        with connection.cursor() as cursor:
            sql = """
            INSERT INTO business (
                contact_name, contact_info, company, position,
                company_size, industry, cooperation_type,
                region, website, needs, is_read
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0)
            """
            values = (
                data.get("contactName"),
                data.get("contactInfo"),
                data.get("company"),
                data.get("position"),
                data.get("companySize"),
                data.get("industry"),
                data.get("cooperationType"),
                data.get("region"),
                data.get("website"),
                data.get("needs"),
            )
            cursor.execute(sql, values)
        connection.commit()
    finally:
        connection.close()

def get_all_business_data():
    connection = connect_to_db()
    try:
        with connection.cursor() as cursor:
            sql = """
            SELECT id, contact_name, contact_info, company, position,
                   company_size, industry, cooperation_type,
                   region, website, needs, is_read, created_at
            FROM business
            ORDER BY created_at ASC
            """
            cursor.execute(sql)
            return cursor.fetchall()
    finally:
        connection.close()

def delete_business_data(item_id):
    connection = connect_to_db()
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM business WHERE id = %s", (item_id,))
        connection.commit()
    finally:
        connection.close()

def mark_business_as_read(item_id):
    connection = connect_to_db()
    try:
        with connection.cursor() as cursor:
            cursor.execute("UPDATE business SET is_read = 1 WHERE id = %s", (item_id,))
        connection.commit()
    finally:
        connection.close()
