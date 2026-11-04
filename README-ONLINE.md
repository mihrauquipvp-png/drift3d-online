# DRIFT 3D — modo online

## O que foi incluído
- Multiplayer em tempo real para até 8 pilotos por sala.
- Jogadores entram automaticamente na sala da pista selecionada.
- Nome e cor do carro aparecem para os outros jogadores.
- O servidor transmite posições 20 vezes por segundo.

## Rodar no próprio computador
1. Instale o Node.js 16 ou superior.
2. Abra um terminal nesta pasta.
3. Execute: `npm start`
4. Abra `http://localhost:3000` no navegador.

Para testar com outra pessoa na mesma rede Wi-Fi, use o endereço de rede
mostrado no terminal (por exemplo, `http://192.168.0.10:3000`).

## Jogar pela internet
O servidor precisa ficar publicado em um serviço que aceite conexões WebSocket.
Depois de publicar, abra o endereço HTTPS do jogo. Em **MENU → CONFIG**:
1. Ative **MULTIPLAYER ONLINE**.
2. Digite seu nome.
3. Se o servidor estiver em outro endereço, informe a URL WebSocket
   (por exemplo, `wss://seu-dominio.com`). Se o jogo e o servidor estiverem
   no mesmo endereço, deixe esse campo vazio.
4. Selecione a mesma pista que seus amigos e clique em **JOGAR**.

## Observações
- Cada pista é uma sala separada.
- O limite atual é de 8 jogadores por sala.
- Para jogar pela internet, todos precisam acessar o mesmo servidor público.
- Não abra `index.html` diretamente como arquivo; execute o servidor com `npm start`.
