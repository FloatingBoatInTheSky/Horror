/**
 * Story Documents, Logs, Keycodes, and Narrative lore
 * Protagonist: James Vance, investigative archivist researching the 1994 disappearances at Valenwood Sub-level 04.
 */
const GAME_LORE = {
  documents: {
    doc_manifest: {
      id: 'doc_manifest',
      title: 'ARQUIVO #01: REGISTRO DE ENTRADA (1994)',
      date: '14/10/1994 — 03:42 AM',
      author: 'Dr. Arthur Sterling, Chefe de Segurança',
      content: `O paciente da Cela 03 parou de emitir ondas cerebrais regulares às 02:15.
No entanto, os monitores cardíacos continuam registrando 140 bpm. Quando a equipe técnica abriu a escotilha de observação, ele não estava lá dentro.

A trava magnética do Bloco B foi selada com código manual temporário: [ 4 8 1 5 ].
Não desçam ao subsolo sem a chave da Sala Elétrica.
Se ouvirem passos no teto, NÃO apontem a lanterna para cima.`
    },
    doc_audio_log: {
      id: 'doc_audio_log',
      title: 'ARQUIVO #02: TRANSCRIÇÃO DE GRAVAÇÃO (FITA 07)',
      date: '28/10/1994 — 23:11 PM',
      author: 'Dra. Helena Ward',
      content: `(Ruído estático intenso...)
"Eles disseram que era apenas alucinação por privação de luz. Mas as portas... elas não estão onde foram construídas. Eu passei pela mesma enfermaria três vezes seguidas.
Se você encontrou esta câmera, James... você não veio me salvar. Você veio porque sua assinatura já estava no livro de entrada há trinta anos.
O fusível reserva está na mesa da Sala de Guarda. O código da Porta do Arquivo Secreto é a soma dos anos dos três desaparecimentos: [ 1 9 9 4 ]."`
    },
    doc_climax: {
      id: 'doc_climax',
      title: 'ARQUIVO #03: RELATÓRIO CONFIDENCIAL DO DIRETOR',
      date: '03/11/1994 — NÃO ENVIADO',
      author: 'Comandante Vance',
      content: `A cobaia 'Zero' nunca foi um paciente desconhecido.
O nome completo no prontuário de admissão é JAMES VANCE.
A câmera que você carrega não está transmitindo para fora. Ela está reproduzindo o mesmo loop da sua própria mente desde o colapso.
Para quebrar o ciclo, você precisa reiniciar o Disjuntor Principal e confrontar o Espelho do Arquivo Central.`
    },
    doc_easter_egg: {
      id: 'doc_easter_egg',
      title: 'NOTA MANUSCRITA ENSANGUENTADA',
      date: 'Sem data',
      author: 'Desconhecido',
      content: `ELE NÃO TEM ROSTO, MAS ELE USA O SEU OLHAR.
CADA VEZ QUE A BATERIA PISCA, ELE DÁ UM PASSO NA SUA DIREÇÃO.`
    }
  },

  puzzles: {
    padlock_block_b: {
      id: 'padlock_block_b',
      code: '4815',
      hint: 'O código está registrado no Manifesto de Entrada de 1994.',
      solved: false
    },
    keypad_archive: {
      id: 'keypad_archive',
      code: '1994',
      hint: 'O ano em que o Bloco B foi selado pela última vez.',
      solved: false
    },
    fuse_box: {
      id: 'fuse_box',
      fusesRequired: 2,
      fusesInserted: 0,
      solved: false
    }
  },

  chapters: [
    {
      id: 0,
      title: 'CAPÍTULO I: O PONTO CEGO',
      objective: 'Explore a ala de recepção e encontre uma lanterna.'
    },
    {
      id: 1,
      title: 'CAPÍTULO II: FREQUÊNCIAS MORTAS',
      objective: 'A porta do Bloco B está trancada. Encontre o Registro de Entrada.'
    },
    {
      id: 2,
      title: 'CAPÍTULO III: A ENFERMARIA VAZIA',
      objective: 'A energia caiu. Encontre 2 fusíveis industriais para religar o gerador.'
    },
    {
      id: 3,
      title: 'CAPÍTULO IV: O SUBSOLO DE ARQUIVOS',
      objective: 'Acesse o Arquivo Central usando o código do terminal (1994).'
    },
    {
      id: 4,
      title: 'CAPÍTULO V: O COLAPSO PSICOLÓGICO',
      objective: 'Descubra a verdade no centro da sala e faça sua escolha final.'
    }
  ]
};

window.GAME_LORE = GAME_LORE;
