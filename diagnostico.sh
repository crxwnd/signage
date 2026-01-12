#!/bin/bash
# =============================================================================
# SCRIPT DE DIAGNÓSTICO - ¿Por qué no se reflejan los cambios?
# =============================================================================
# Ejecutar desde la raíz del proyecto: bash diagnostico.sh
# =============================================================================

set -e

echo "=========================================="
echo "DIAGNÓSTICO DEL PROYECTO SIGNAGE"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. VERIFICAR ESTADO DE GIT
echo "1. ESTADO DE GIT"
echo "----------------------------------------"
echo "Último commit:"
git log --oneline -1
echo ""

MODIFIED=$(git status --porcelain | wc -l)
if [ "$MODIFIED" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Hay $MODIFIED archivos con cambios sin commit:${NC}"
    git status --short
    echo ""
    echo -e "${RED}PROBLEMA: Los cambios de Antigravity no se guardaron${NC}"
    echo "Solución: Ejecuta 'git add . && git commit -m \"fix: apply changes\"'"
else
    echo -e "${GREEN}✓ Todos los cambios están committed${NC}"
fi
echo ""

# 2. VERIFICAR DOCKER
echo "2. ESTADO DE DOCKER"
echo "----------------------------------------"
FRONTEND_RUNNING=$(docker ps --filter "name=signage-frontend" --format "{{.Status}}" 2>/dev/null || echo "not running")
if [[ "$FRONTEND_RUNNING" == *"Up"* ]]; then
    echo -e "${GREEN}✓ Container frontend está corriendo${NC}"
    echo "   Status: $FRONTEND_RUNNING"
else
    echo -e "${RED}✗ Container frontend NO está corriendo${NC}"
    echo "   Ejecuta: docker-compose up -d"
fi
echo ""

# 3. COMPARAR ARCHIVOS
echo "3. COMPARACIÓN DE ARCHIVOS (Local vs Container)"
echo "----------------------------------------"

# Archivo de prueba: settings/users/page.tsx
LOCAL_FILE="apps/frontend/src/app/(dashboard)/settings/users/page.tsx"
CONTAINER_PATH="/app/apps/frontend/src/app/(dashboard)/settings/users/page.tsx"

if [ -f "$LOCAL_FILE" ]; then
    LOCAL_HASH=$(md5sum "$LOCAL_FILE" 2>/dev/null | cut -d' ' -f1 || md5 -q "$LOCAL_FILE" 2>/dev/null)
    
    if docker ps --filter "name=signage-frontend" --format "{{.Names}}" | grep -q "signage-frontend"; then
        CONTAINER_HASH=$(docker exec signage-frontend md5sum "$CONTAINER_PATH" 2>/dev/null | cut -d' ' -f1 || echo "error")
        
        if [ "$LOCAL_HASH" = "$CONTAINER_HASH" ]; then
            echo -e "${GREEN}✓ Archivos sincronizados correctamente${NC}"
            echo "   Hash: $LOCAL_HASH"
        else
            echo -e "${RED}✗ ARCHIVOS DIFERENTES!${NC}"
            echo "   Local:     $LOCAL_HASH"
            echo "   Container: $CONTAINER_HASH"
            echo ""
            echo -e "${YELLOW}PROBLEMA: Docker no está sincronizando los archivos${NC}"
            echo "Solución:"
            echo "  1. docker-compose down"
            echo "  2. rm -rf apps/frontend/.next"
            echo "  3. docker-compose up -d --build --force-recreate"
        fi
    else
        echo -e "${YELLOW}⚠️  No se puede comparar - container no está corriendo${NC}"
    fi
else
    echo -e "${RED}✗ Archivo local no existe: $LOCAL_FILE${NC}"
fi
echo ""

# 4. VERIFICAR VOLUMES DE DOCKER
echo "4. CONFIGURACIÓN DE VOLUMES"
echo "----------------------------------------"
if [ -f "docker-compose.yml" ]; then
    echo "Volumes del frontend en docker-compose.yml:"
    grep -A 10 "frontend:" docker-compose.yml | grep -A 5 "volumes:" | head -6
    echo ""
    
    # Verificar si monta todo el directorio
    if grep -q "./apps/frontend:/app/apps/frontend" docker-compose.yml; then
        echo -e "${GREEN}✓ Monta todo el directorio frontend${NC}"
    else
        echo -e "${RED}✗ NO monta todo el directorio frontend${NC}"
        echo "   Puede estar montando solo /src"
    fi
else
    echo -e "${RED}✗ docker-compose.yml no encontrado${NC}"
fi
echo ""

# 5. VERIFICAR CACHE DE NEXT.JS
echo "5. CACHE DE NEXT.JS"
echo "----------------------------------------"
if [ -d "apps/frontend/.next" ]; then
    NEXT_SIZE=$(du -sh apps/frontend/.next 2>/dev/null | cut -f1)
    echo "Tamaño del cache .next: $NEXT_SIZE"
    echo -e "${YELLOW}Recomendación: Borrar si hay problemas de sincronización${NC}"
    echo "   rm -rf apps/frontend/.next"
else
    echo -e "${GREEN}✓ No hay cache .next local${NC}"
fi
echo ""

# 6. BUSCAR EL BUG hotels.map
echo "6. BUSCAR BUG: hotels.map is not a function"
echo "----------------------------------------"
if [ -f "$LOCAL_FILE" ]; then
    # Buscar uso de hotels.map sin protección
    UNSAFE_MAP=$(grep -n "hotels\.map" "$LOCAL_FILE" 2>/dev/null | grep -v "|| \[\]" | grep -v "Array.isArray" || echo "")
    
    if [ -n "$UNSAFE_MAP" ]; then
        echo -e "${RED}✗ Encontrado uso inseguro de hotels.map:${NC}"
        echo "$UNSAFE_MAP"
        echo ""
        echo "Solución: Cambiar 'hotels.map' por '(hotels || []).map'"
    else
        echo -e "${GREEN}✓ No se encontró uso inseguro de hotels.map${NC}"
    fi
else
    echo "No se puede verificar - archivo no existe"
fi
echo ""

# 7. VERIFICAR LOGS DE ERRORES
echo "7. ÚLTIMOS ERRORES DEL FRONTEND (si está corriendo)"
echo "----------------------------------------"
if docker ps --filter "name=signage-frontend" --format "{{.Names}}" | grep -q "signage-frontend"; then
    echo "Últimas 20 líneas de logs:"
    docker logs signage-frontend --tail 20 2>&1 | grep -i "error\|fail\|warn" || echo "No hay errores recientes"
else
    echo "Container no está corriendo"
fi
echo ""

# RESUMEN
echo "=========================================="
echo "RESUMEN Y ACCIONES RECOMENDADAS"
echo "=========================================="

if [ "$MODIFIED" -gt 0 ]; then
    echo -e "${RED}1. CRÍTICO: Hay cambios sin commit${NC}"
    echo "   Ejecuta: git add . && git commit -m 'fix: apply pending changes'"
    echo ""
fi

echo "2. Para forzar sincronización completa:"
echo "   docker-compose down"
echo "   rm -rf apps/frontend/.next"
echo "   docker system prune -f"
echo "   docker-compose up -d --build --force-recreate"
echo ""

echo "3. Para ver cambios en tiempo real:"
echo "   docker-compose logs -f frontend"
echo ""

echo "=========================================="
echo "FIN DEL DIAGNÓSTICO"
echo "=========================================="
