import os
import psycopg2

DB_URL = "postgresql://postgres:postgres@localhost:5432/priere_bethesda"
OUTPUT_FILE = "database_priere_bethesda.sql"

def dump_sql():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("-- DUMP BASE DE DONNEES PRIERE BETHESDA --\n")
        f.write("-- TEMPLE BETHESDA DE YOPOUGON NIANGON SUD --\n\n")
        
        # Get all table names
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        tables = [row[0] for row in cur.fetchall()]
        
        for table in tables:
            f.write(f"\n-- Structure et données de la table: {table} --\n")
            
            # Fetch columns
            cur.execute(f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '{table}';
            """)
            columns_info = cur.fetchall()
            col_names = [c[0] for c in columns_info]
            
            # Fetch rows
            cur.execute(f"SELECT * FROM {table};")
            rows = cur.fetchall()
            
            for row in rows:
                values = []
                for val in row:
                    if val is None:
                        values.append("NULL")
                    elif isinstance(val, bool):
                        values.append("TRUE" if val else "FALSE")
                    elif isinstance(val, (int, float)):
                        values.append(str(val))
                    else:
                        val_str = str(val).replace("'", "''")
                        values.append(f"'{val_str}'")
                
                cols_str = ", ".join([f'"{c}"' for c in col_names])
                vals_str = ", ".join(values)
                f.write(f'INSERT INTO "{table}" ({cols_str}) VALUES ({vals_str});\n')

    conn.close()
    print(f"Base de données exportée avec succès dans {OUTPUT_FILE}")

if __name__ == '__main__':
    dump_sql()
