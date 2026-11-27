# Ejemplo del estilo Viral: qué efecto lleva cada frase

El vídeo es `ejemplo.mp4` y la hoja `fotogramas.jpg` enseña 12 fotogramas repartidos por todo el vídeo. Es la demo de Jorge Morcuende hecha con esta misma plantilla.
**Tómalo como referencia de estilo, no de tema:** el vídeo del usuario puede hablar de cualquier cosa. Fíjate en qué bloques usa, en qué orden, cuánto dura cada uno y cómo lo que se dice se convierte en un texto corto en pantalla, y haz lo mismo con la voz del usuario.

Formato: 1080×1920 · duración 23,80 s.

## 1. `abertura`: 0,00–1,92 s
Lo que dice: «La miel es uno de los pocos alimentos»

```json
{"texto": "La miel prácticamente no se estropea", "destaque": "no se estropea", "em": 0}
```

## 2. `corte`: 1,92–3,12 s
Lo que dice: «que prácticamente no»

```json
{"imagem": {"id": "miel", "efeito": "aproximar"}}
```

## 3. `pop`: 5,62–6,60 s
Lo que dice: «encontraron tarros de miel en»

```json
{"em": 5.8, "imagem": {"id": "tarro"}}
```

## 4. `corte`: 6,60–7,41 s
Lo que dice: «tumbas de Egipto»

```json
{"imagem": {"id": "piramides", "efeito": "aproximar"}, "zoom": 1.4}
```

## 5. `numero`: 7,41–9,00 s
Lo que dice: «de más de 3.000 años»

```json
{"valor": 3000, "em": 7.92, "prefixo": "+", "rotulo": "años", "rotuloEm": 8.55}
```

## 6. `destaque`: 9,00–10,64 s
Lo que dice: «y todavía se podía comer.»

```json
{"texto": "todavía se podía comer", "em": 9.26, "nivel": "chave"}
```

## 7. `comparacao`: 10,68–14,30 s
Lo que dice: «El secreto es sencillo: casi nada de agua y mucho azúcar.»

```json
{"titulo": "El secreto es sencillo", "modo": "contra", "lados": [{"rotulo": "Agua", "texto": "casi nada", "em": 12.04, "imagem": {"id": "agua"}}, {"rotulo": "Azúcar", "texto": "mucho", "em": 13.25, "imagem": {"id": "azucar"}}]}
```

## 8. `corte`: 15,85–16,72 s
Lo que dice: «bacteria.»

```json
{"imagem": {"id": "bacteria", "efeito": "aproximar"}}
```

## 9. `pop`: 17,45–18,45 s
Lo que dice: «tu miel se ha cristalizado,»

```json
{"em": 17.57, "imagem": {"id": "cristalizada"}}
```

## 10. `destaque`: 18,80–19,70 s
Lo que dice: «no la tires.»

```json
{"texto": "no la tires", "em": 18.82, "nivel": "alerta"}
```

## 11. `pop`: 19,72–21,55 s
Lo que dice: «Solo tienes que calentarla al baño María.»

```json
{"imagem": {"id": "banomaria"}}
```

## 12. `cta`: 21,86–23,80 s
Lo que dice: «Mándaselo a quien tira la miel.»

```json
{"texto": "Mándaselo a quien tira la miel", "destaque": "tira la miel", "em": 21.88}
```

## Lo que la edición de Jorge tiene y la plantilla no

El plan de arriba es el de la edición de Jorge tal cual. Su vídeo es un selfie muy cerca de la cámara y lleva un encuadre propio (el campo `perto` de su plan) que la plantilla no tiene: los textos de pantalla completa van encima de la cabeza y no en el pecho, el zoom se ancla arriba mientras se ven y el subtítulo va debajo de la barbilla. Por eso en `fotogramas.jpg` el gancho, el número y el destacado salen arriba; con la plantilla salen a la altura del pecho.

Su edición fue el piloto de esta edición en español: en la hoja hay pantallas de subtítulo que acaban en palabra átona («EN TUMBAS DE», «CALENTARLA AL»). La plantilla ya no las parte así: ninguna pantalla acaba en átona.

`impactos` (un golpe de zoom en «arqueólogos») y el `em` de los `pop` sí existen en la plantilla.

`assets/template/src/plano.json` es este mismo plan adaptado a la plantilla: sin `perto` y con las fotos de muestra de la plantilla en lugar de las de Jorge, que no van en la skill (`escorrendo` en vez de `miel`, `potes` en vez de `tarro`, `acucar` en vez de `azucar`, `cristalizado` en vez de `cristalizada` y `banhomaria` en vez de `banomaria`; `piramides`, `agua` y `bacteria` se llaman igual).
