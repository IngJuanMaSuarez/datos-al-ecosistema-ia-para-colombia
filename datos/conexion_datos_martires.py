
import requests
import pandas as pd
from datetime import date


FECHA_INICIO = date(2019, 1, 6)   # Primer domingo semana 1 de 2019
FECHA_FIN    = date(2021, 12, 26)  # Último domingo semana 52 de 2021

# Rango de semanas ISO que cubre el período
semanas = pd.date_range(start=FECHA_INICIO, end=FECHA_FIN, freq="W-SUN")

print("=" * 55)
print("  PERÍODO DE COINCIDENCIA ENTRE LOS TRES DATASETS")
print("=" * 55)
print(f"  Inicio : {FECHA_INICIO}  (semana ISO {FECHA_INICIO.isocalendar()[1]}/{FECHA_INICIO.year})")
print(f"  Fin    : {FECHA_FIN}  (semana ISO {FECHA_FIN.isocalendar()[1]}/{FECHA_FIN.year})")
print(f"  Total  : {len(semanas)} semanas")
print("=" * 55)

URL_PRECIPITACION = "https://www.datos.gov.co/resource/s54a-sgyg.json"

def get_precipitacion(fecha_inicio: date, fecha_fin: date, limit: int = 50_000) -> pd.DataFrame:
    """
    Descarga registros de precipitación en el rango de fechas indicado.
    La API usa Socrata Query Language (SoQL).
    """
    params = {
        "$where": (
            f"fechaobservacion >= '{fecha_inicio.isoformat()}T00:00:00.000' "
            f"AND fechaobservacion <= '{fecha_fin.isoformat()}T23:59:59.000'"
        ),
        "$limit": limit,
        "$order": "fechaobservacion ASC",
    }

    resp = requests.get(URL_PRECIPITACION, params=params, timeout=60)
    resp.raise_for_status()

    df = pd.DataFrame(resp.json())
    if df.empty:
        return df

    df["fecha"] = pd.to_datetime(df["fechaobservacion"])
    df["semana_iso"] = df["fecha"].dt.isocalendar().week.astype(int)
    df["anio"]       = df["fecha"].dt.year

    # Columnas numéricas relevantes
    for col in ["valor", "latitud", "longitud"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    return df

# 3. CONEXIÓN – SINIESTROS / ACCIDENTES (datos.gov.co / Socrata API)

URL_SINIESTROS = "https://www.datos.gov.co/resource/3v2w-chcq.json"

def get_siniestros(fecha_inicio: date, fecha_fin: date, limit: int = 50_000) -> pd.DataFrame:
    """
    Descarga el histórico de siniestros viales en el rango de fechas.
    Filtra únicamente la localidad Los Mártires (código 14).
    """
    params = {
        "$where": (
            f"fecha_acc >= '{fecha_inicio.isoformat()}T00:00:00.000' "
            f"AND fecha_acc <= '{fecha_fin.isoformat()}T23:59:59.000' "
            f"AND localidad = '14'"          # Localidad Los Mártires
        ),
        "$limit": limit,
        "$order": "fecha_acc ASC",
    }

    resp = requests.get(URL_SINIESTROS, params=params, timeout=60)
    resp.raise_for_status()

    df = pd.DataFrame(resp.json())
    if df.empty:
        return df

    df["fecha_acc"] = pd.to_datetime(df["fecha_acc"])
    df["semana_iso"] = df["fecha_acc"].dt.isocalendar().week.astype(int)
    df["anio"]       = df["fecha_acc"].dt.year

    for col in ["latitud", "longitud"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    return df

# 4. CONEXIÓN – RED SEMAFÓRICA (datos.gov.co / Socrata API)


URL_SEMAFOROS = "https://www.datos.gov.co/resource/2gfp-jiqi.json"

def get_semaforos(fecha_instalacion_max: date, limit: int = 10_000) -> pd.DataFrame:
    """
    Descarga la red semafórica instalada antes o durante el período de análisis.
    No tiene dato temporal continuo; se filtra por fecha de instalación ≤ fecha_fin.
    """
    params = {
        "$where": f"fecha_instalacion <= '{fecha_instalacion_max.isoformat()}T23:59:59.000'",
        "$limit": limit,
        "$order": "fecha_instalacion ASC",
    }

    resp = requests.get(URL_SEMAFOROS, params=params, timeout=60)
    resp.raise_for_status()

    df = pd.DataFrame(resp.json())
    if df.empty:
        return df

    if "fecha_instalacion" in df.columns:
        df["fecha_instalacion"] = pd.to_datetime(df["fecha_instalacion"])

    for col in ["latitud", "longitud"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    return df


# 5. EJECUCIÓN PRINCIPAL

if __name__ == "__main__":

    print("\n[1/3] Descargando PRECIPITACIÓN …")
    df_precip = get_precipitacion(FECHA_INICIO, FECHA_FIN)
    print(f"      → {len(df_precip):,} registros")
    if not df_precip.empty:
        print(df_precip[["fechaobservacion", "semana_iso", "anio", "valorobservado"]].head(3).to_string(index=False))

    print("\n[2/3] Descargando SINIESTROS …")
    df_siniestros = get_siniestros(FECHA_INICIO, FECHA_FIN)
    print(f"      → {len(df_siniestros):,} registros")
    if not df_siniestros.empty:
        print(df_siniestros[["fecha_acc", "semana_iso", "anio"]].head(3).to_string(index=False))

    print("\n[3/3] Descargando RED SEMAFÓRICA …")
    df_semaforos = get_semaforos(FECHA_FIN)
    print(f"      → {len(df_semaforos):,} registros")
    if not df_semaforos.empty:
        print(df_semaforos.head(3).to_string(index=False))

    print("\n✓ Los tres datasets han sido cargados en el período de coincidencia.")
    print(f"  Semanas disponibles para análisis: {len(semanas)}")
    print(f"  Desde {semanas[0].date()} hasta {semanas[-1].date()}")
