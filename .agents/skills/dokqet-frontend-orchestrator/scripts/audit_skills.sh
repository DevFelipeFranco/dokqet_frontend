#!/bin/bash
# Script de Auditoría de Skills para Dokqet Frontend
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
SKILLS_DIR="$PROJECT_ROOT/.agents/skills"

echo "=========================================================="
echo "🔍 Auditando Skills de Dokqet Frontend en: $SKILLS_DIR"
echo "=========================================================="

if [ ! -d "$SKILLS_DIR" ]; then
  echo "❌ Error: Directorio de skills no encontrado: $SKILLS_DIR"
  exit 1
fi

TOTAL_SKILLS=0
PASSED_SKILLS=0

for skill in "$SKILLS_DIR"/*; do
  if [ -d "$skill" ]; then
    SKILL_NAME=$(basename "$skill")
    TOTAL_SKILLS=$((TOTAL_SKILLS + 1))
    echo "▶ Verificando skill: $SKILL_NAME"

    if [ ! -f "$skill/SKILL.md" ]; then
      echo "  ❌ Falta SKILL.md en $SKILL_NAME"
      continue
    fi

    echo "  ✅ Estructura válida para $SKILL_NAME"
    PASSED_SKILLS=$((PASSED_SKILLS + 1))
  fi
done

echo "=========================================================="
echo "📊 Resumen: $PASSED_SKILLS de $TOTAL_SKILLS skills validadas correctamente."
echo "=========================================================="
