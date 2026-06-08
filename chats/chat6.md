# Formulaire vérification pièces

_Started 2026-06-08 06:19 UTC_

---

## User

sur la page de verif la zone "Sous ensembles utilisés" il faut que il puisse marquer plusieurs characters sans que ça quitte le champ dans les n° piece,

il faut egalement que quand on arrive sur la page de verification que l on arrive forcément en haut de la page pour ne pas avoir a remonter mais juste descendre,

et sur ala premiere page ou on choisis projet → organe → poste... il faut que verification, pieces, ordre de fabrication apparaisse comme la de base mais si on scroll plus bas ou qu on selectionne un op plus bas que l on ai pas a tout remonté et que ses zones s affiche a côté et meme si on scroll que cela reste visible a côté

## Assistant

_[tool: read_file]_

_[tool: list_files]_

I'll start by reading the prototype file to understand its structure.

_[tool: read_file]_

_[tool: read_file]_

_[tool: str_replace_edit]_

I understand all three issues. Let me explain the key one: the focus-loss bug happens because `SousEnsTable` and `CordonTable` are defined as components *inside* `OPForm`, so React remounts them on every keystroke. I'll fix all three.

**Fix 1 & 2** — `cqs-op-form.jsx` (focus loss + scroll to top):

_[tool: str_replace_edit]_

**Fix 3** — `cqs-screens.jsx` (sticky Vérification/Pièces/OF column):Now let me verify it loads cleanly.

_[tool: done]_

Les trois corrections sont en place :

1. **Saisie n° pièce** — le champ ne perd plus le focus à chaque caractère (les tableaux étaient recréés à chaque frappe ; corrigé).
2. **Page de vérification** — on arrive maintenant toujours en haut.
3. **Page projet → organe → poste** — la colonne *Vérification / Pièces / Ordres de fabrication* reste collée et visible à côté quand on scrolle ou qu'on sélectionne un OP plus bas.

_[tool: fork_verifier_agent]_

C'est fait. Teste la saisie dans « Sous ensembles utilisés » et le comportement collant de la colonne — dis-moi si un ajustement est nécessaire.

## User

dans la zone "Sous ensembles utilisés" centre les deux checkboxs "Retouché
O/N"

## Assistant

_[tool: str_replace_edit]_

Les deux cases « Retouché O/N » sont maintenant centrées dans leurs cellules.

