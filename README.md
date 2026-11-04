# SUBSOLO 04 — Jogo de Terror Psicológico 3D (WebGL / Three.js)

Um jogo de terror psicológico original em primeira pessoa para navegador (PC, Mobile e Consoles), desenvolvido em JavaScript puro com Three.js e Web Audio API. Compatível com GitHub Pages como site estático leve e de alta performance.

---

## 🎮 Sinopse
Em 14 de outubro de 1994, a ala de isolamento experimental do **Subsolo 04** foi selada sem explicação pública. Trinta anos depois, o arquivista James Vance encontra uma fita cassete com sua própria assinatura no livro de registro. Ao descer os degraus de concreto úmido munido apenas de uma câmera portátil e uma lanterna militar, James descobre que as portas mudam de lugar, os disjuntores respondem a frequências esquecidas e o arquivo final esconde a verdade sobre sua própria identidade.

---

## 🕹️ Controles

### PC (Teclado e Mouse)
- **W, A, S, D / Setas**: Movimentação
- **Mouse**: Câmera (Clique na tela para Pointer Lock)
- **E**: Interagir (Portas, Documentos, Itens, Painéis)
- **F**: Ligar / Desligar Lanterna
- **Shift**: Correr
- **C / Ctrl**: Agachar
- **ESC**: Menu de Pausa

### Mobile (Smartphones e Tablets)
- **Analógico Virtual (Esquerda)**: Movimentação em 360°
- **Toque e Arraste (Direita)**: Controle suave de câmera
- **Botões na Tela**: [E] Interagir, [Luz] Lanterna, [Inv] Inventário, [||] Pausa

### Gamepad / Xbox
- **Analógico Esquerdo**: Mover
- **Analógico Direito**: Olhar
- **Botão A**: Interagir
- **Botão X / Y**: Lanterna
- **Botão B**: Correr

---

## ⚙️ Tecnologias e Otimizações
- **Motor 3D**: Three.js WebGL otimizado com renderização low-poly e nevoeiro exponencial atmosférico.
- **Áudio Procedural**: Web Audio API com síntese em tempo real de drones de subgraves, zumbido de lâmpadas fluorescentes, estática de rádio e batimentos cardíacos — sem arquivos `.wav` ou `.mp3` pesados para baixar.
- **Texturas Procedurais**: Geração dinâmica de concreto, azulejos decaídos, ferrugem e placas de aviso em Canvas 2D.
- **HUD e VHS**: Efeitos retrô de câmera encontrados (REC, bateria, scanlines, ruído visual) adaptativos por qualidade (High, Medium, Low).
- **Salvamento Automático**: LocalStorage persistente de inventário, capítulos, puzzles resolvidos e configurações.
- **Dois Finais Reais**: Escolha climática ao confrontar o espelho do Arquivo Central.

---

## 🚀 Como Jogar no GitHub Pages
1. Hospede os arquivos diretamente na raiz da branch `main` ou `gh-pages`.
2. Todos os caminhos de assets e scripts são relativos (`./`), funcionando perfeitamente em qualquer subdiretório do GitHub Pages.
