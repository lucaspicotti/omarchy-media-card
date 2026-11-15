# Media Card para a barra do Omarchy

[English](README.md)

O que está tocando, na barra e a um clique: a faixa na barra em um de três estilos, e um card com a
capa, o progresso, os controles, os outros players e as configurações do próprio plugin.

- **Três estilos na barra**, escolhidos nas configurações do card:
  - **Mínimo**: um ícone e "Artista — Faixa", cortado em 28 caracteres;
  - **Controles**: a capa, o título e anterior, play/pause, próxima;
  - **Ícone** (o padrão): a capa, o play/pause e uma linha fina de progresso. Ocupa menos espaço.
- **Na barra**: o clique abre o card, o do meio toca ou pausa, o direito passa para o próximo player
  com faixa, e a roda muda o volume do próprio player, 5% por passo. Sobre os botões da barra, o
  direito e o do meio fazem o mesmo, para não atrapalhar.
- **O card**: uma aba por player (só com mais de um), a capa (o clique toca ou pausa), o título (o
  clique copia), artista e álbum, o progresso com os dois tempos, e aleatório, anterior, play/pause,
  próxima e repetir (desligado → a lista → esta faixa). Um controle opcional muda o volume do player,
  "Também tocando" lista os outros players com um botão para trocar, e "Abrir Spotify" (ou o nome do
  player) traz a janela do player para a frente.
- **Qualquer player MPRIS**: Spotify, navegadores, mpv, VLC… Players sem faixa ficam de fora, assim
  como o playerctld, que só espelha outro player. A barra acompanha o player que está tocando; um
  player escolhido na aba ou no clique direito fica até outro começar a tocar.
- **Barras laterais**: numa barra à esquerda ou à direita, o widget se empilha ao longo da barra, só
  com a capa e o play/pause.
- **Pronto para 50 idiomas**: vêm inglês e português; os outros caem no inglês, e o card segue o
  idioma escolhido em Setup > Language sem reiniciar. Idiomas da direita para a esquerda leem
  espelhados, com os controles e os tempos na ordem certa.

## Leve no sistema

Os players vêm da lista MPRIS do Quickshell, que o D-Bus mantém atualizada: nada é consultado em
intervalos. A posição é pedida uma vez por segundo, e só enquanto aparece na tela (a linha de
progresso ou o card aberto) e a faixa está andando. As capas são decodificadas no tamanho em que são
desenhadas. O plugin roda dois comandos, e só quando você pede: `wl-copy` ao copiar um título e
`omarchy-bar set` ao mudar uma configuração.

## Seguro com o que os players mandam

Títulos, artistas e nomes de player vêm de qualquer programa que se registrou como player. Eles
aparecem sempre como texto puro, nunca como marcação. As capas só são carregadas de `https://` ou de
um `file://` local, sem espaços nem caracteres de controle e com no máximo 2048 caracteres. Os
comandos rodam como lista de argumentos, nunca por um shell.

## Instalar

```bash
omarchy plugin add https://github.com/lucaspicotti/omarchy-media-card --enable
```

Atualize com `omarchy plugin update lucaspicotti.media-card`. Ele fica ao lado do relógio
(`centerEnd`); mova com `omarchy bar move lucaspicotti.media-card --section <seção>`. O widget de
mídia do próprio Omarchy faz o mesmo papel, então talvez você queira
`omarchy plugin disable omarchy.media`.

Para abrir o card pelo teclado, acrescente em `~/.config/hypr/bindings.lua`:

```lua
o.bind("SUPER + CTRL + M", "Media", { panel = "lucaspicotti.media-card" })
```

Ele só abre enquanto algo está tocando.

## Remover

```bash
omarchy plugin remove lucaspicotti.media-card
```

O plugin não grava nada fora da pasta dele, a não ser as configurações, que ficam na entrada dele na
barra em `~/.config/omarchy/shell.json`.

## Configurações

Mude no card (Configurações, no rodapé) ou com
`omarchy bar set lucaspicotti.media-card <opção> <valor> --json`. Valem na hora.

| Opção | Padrão | |
|---|---|---|
| `barStyle` | `"icon"` | `"minimal"`, `"controls"` ou `"icon"`: veja acima |
| `hideWhenIdle` | `true` | o widget sai da barra enquanto nenhum player tem faixa |
| `showVolume` | `false` | o volume do player no card, para os players que permitem |
| `showOthers` | `true` | "Também tocando" no card; as abas continuam de qualquer jeito |

## Requisitos

Omarchy com o shell Quickshell (testado na 4.5) e `wl-clipboard` para copiar títulos, os dois parte
de uma instalação padrão do Omarchy.

## Limites conhecidos

- Dois players com o mesmo nome (duas janelas de navegador) ganham abas com o mesmo rótulo.
- O volume é o do próprio player, não o do sistema; players que não o expõem ignoram a roda.
- Se gravar uma configuração falhar (o widget não está na barra), a chave simplesmente não muda.
- A barra de cada monitor guarda a sua própria escolha de player.
- Se uma mudança de código não aparecer depois de atualizar, rode `omarchy restart shell`.

## Testes

```bash
npm test   # o modelo no Node; BarWidget.qml e MediaCard.qml acionados com o mouse no qmltestrunner
```

Os testes de QML precisam do `qt6-declarative`. Eles carregam o widget e o card de verdade sobre
substitutos do `qs.Ui` e do `qs.Commons` do Omarchy e do Quickshell (`tests/qml/stubs`);
`tests/qml-stubs.test.js` confere cada substituto contra o Omarchy instalado na máquina, para que os
testes não passem com uma API que o shell não tem.

## Licença

MIT
