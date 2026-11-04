/**
 * PRETEND IT'S NOT THERE - Lore, Rules, Documents, Daily Routine
 * Protagonist: Mark Linwood, staying at his late grandmother's house in Blackwood Pines.
 * Core Psychological Rule:
 * "It feeds on your gaze. If you see something standing in the hallway, turn away, do your routine, pretend it's not there."
 */
const GAME_LORE = {
  routine: [
    {
      hour: '01:00 AM',
      title: 'A CHEGADA EM SILÊNCIO',
      task: 'Acenda as luzes do corredor ou pegue a lanterna na cômoda do quarto.'
    },
    {
      hour: '02:15 AM',
      title: 'FECHAR AS CORTINAS',
      task: 'A chuva começou. Vá até a sala de estar e feche as cortinas da janela grande.'
    },
    {
      hour: '03:00 AM',
      title: 'A PRIMEIRA REGRA',
      task: 'Encontre o diário antigo na mesa de centro e leia as instruções da casa.'
    },
    {
      hour: '03:40 AM',
      title: 'A BATIDA NA PORTA',
      task: 'Alguém bateu três vezes na porta dos fundos. Não olhe pela fresta. Verifique o fusível do porão.'
    },
    {
      hour: '04:20 AM',
      title: 'A COZINHA QUE MUDOU',
      task: 'A torneira está pingando sangue ou água escura. Encontre a chave do sótão na estante.'
    },
    {
      hour: '05:00 AM',
      title: 'A HORA DOS OLHOS',
      task: 'Ele está no corredor. Não mantenha contato visual. Alcance o telefone no quarto e chame ajuda.'
    }
  ],

  documents: {
    rule_note: {
      id: 'rule_note',
      title: 'A FOLHA RASGADA DEBAIXO DA CÔMODA',
      date: 'Outubro de 1998',
      author: 'Vovó Eleanor',
      content: `Mark, se você está lendo isso, você voltou para esta casa contra o meu conselho.

A entidade que caminha entre as tábuas do piso não possui forma fixa. Ela só ganha peso e ossos quando alguém a reconhece.
Se uma figura alta e sem rosto surgir no fim do corredor:

1. NÃO CORRA.
2. NÃO ENCARE OS OLHOS DELA.
3. OLHE PARA O CHÃO OU VIRE AS COSTAS.
4. FINJA QUE ELA NÃO ESTÁ LÁ.

Se você fingir que ela não existe por tempo suficiente... ela é forçada a desaparecer.`
    },
    diary_page: {
      id: 'diary_page',
      title: 'DIÁRIO DA FAMÍLIA (PÁGINA 42)',
      date: 'Novembro de 1998',
      author: 'Diário de Eleanor',
      content: `Ontem à noite, Mark era apenas um menino. Ele jurou que o casaco pendurado no cabideiro respirava.
Eu ri e disse que era apenas a brisa do inverno.
Mas quando fui desligar a chaleira, o casaco estava sentado à mesa, com as mãos postas, esperando o café da manhã.
O código do cofre do quarto é o ano em que tudo começou: [ 1 9 8 7 ].`
    },
    newspaper: {
      id: 'newspaper',
      title: 'RECORTE DO JORNAL LOCAL (1987)',
      date: '12 de Setembro de 1987',
      author: 'Gazeta de Blackwood',
      content: `MISTERIOSA MORTE NA COLINA DE PINHEIROS.
Os paramédicos relataram que o proprietário anterior foi encontrado sentado no sofá, com os olhos perfeitamente intactos, mas com a expressão congelada de quem viu algo além da compreensão humana.
A casa permaneceu fechada por onze anos antes de ser herdada pela família Linwood.`
    },
    letter_final: {
      id: 'letter_final',
      title: 'CARTA NUNCA ENVIADA',
      date: 'Hoje',
      author: 'Mark Linwood',
      content: `Eu pensei que estava sozinho aqui.
Mas os passos no teto combinam exatamente com o ritmo dos meus próprios passos.
Quando eu paro... o teto para um segundo depois.
Ela não está na casa. Ela é a casa.`
    }
  }
};

window.GAME_LORE = GAME_LORE;
