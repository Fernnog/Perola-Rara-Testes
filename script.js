/* ==== INÍCIO - Configuração e Inicialização do Firebase ==== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, query, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js"; // Import *deleteDoc*
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDG1NYs6CM6TDfGAPXSz1ho8_-NWs28zSg", // SUA API KEY
    authDomain: "perola-rara.firebaseapp.com",       // SEU AUTH DOMAIN
    projectId: "perola-rara",                     // SEU PROJECT ID
    storageBucket: "perola-rara.firebasestorage.app", // SEU STORAGE BUCKET
    messagingSenderId: "502232132512",               // SEU MESSAGING SENDER ID
    appId: "1:502232132512:web:59f227a7d35b39cc8752c5", // SEU APP ID
    measurementId: "G-VHVMR10RSQ"                   // SEU MEASUREMENT ID (se usar Analytics)
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Opcional
const db = getFirestore(app);
const auth = getAuth(app); // Adicionado para autenticação
const orcamentosPedidosRef = collection(db, "Orcamento-Pedido");
/* ==== FIM - Configuração e Inicialização do Firebase ==== */

/* ==== INÍCIO SEÇÃO - VARIÁVEIS GLOBAIS ==== */
let numeroOrcamento = 1;
let numeroPedido = 1;
const anoAtual = new Date().getFullYear();
let orcamentoEditando = null;
let orcamentos = []; // Array para armazenar orçamentos
let pedidos = [];    // Array para armazenar pedidos
let usuarioAtual = null; // Armazena o usuário logado
/* ==== FIM SEÇÃO - VARIÁVEIS GLOBAIS ==== */

/* ==== INÍCIO SEÇÃO - AUTENTICAÇÃO ==== */
// Referências aos elementos do HTML (Autenticação)
const btnRegister = document.getElementById('btnRegister');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const authStatus = document.getElementById('authStatus');
const emailInput = document.getElementById('email'); //Mesmo ID no HTML
const passwordInput = document.getElementById('password'); //Mesmo ID no HTML
const authSection = document.getElementById('authSection');
const appContent = document.getElementById('appContent'); //Para mostrar Sections

// Função para lidar com a interface de autenticação
function updateAuthUI(user) {
    if (user) {
        authStatus.textContent = "Usuário autenticado: " + user.email;
        btnLogout.style.display = "inline-block";
        btnLogin.style.display = "none";
        btnRegister.style.display = "none";
        authSection.style.display = "block"; //Sempre mostrar
        appContent.style.display = "block";      // Mostrar conteúdo principal

        // Carrega dados *somente* após autenticação
        carregarDados();
    } else {
        authStatus.textContent = "Nenhum usuário autenticado";
        btnLogout.style.display = "none";
        btnLogin.style.display = "inline-block";
        btnRegister.style.display = "inline-block";
        authSection.style.display = "block";  //Sempre mostrar
        appContent.style.display = "none"; // Ocultar conteúdo principal

        // Limpar os dados se o usuário fizer logout.
        orcamentos = [];
        pedidos = [];
        numeroOrcamento = 1;
        numeroPedido = 1;
        mostrarOrcamentosGerados(); // Atualiza a exibição
        mostrarPedidosRealizados();
    }
}

// Listeners de eventos para os botões de autenticação
btnRegister.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
     if (!email || !password) {
        alert("Preencha email e senha para registrar.");
        return;
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Usuário registrado:", userCredential.user);
        updateAuthUI(userCredential.user); // Atualiza a UI
    } catch (error) {
        console.error("Erro no registro:", error);
        alert("Erro no registro: " + error.message);
    }
});

btnLogin.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        alert("Preencha email e senha para entrar.");
        return;
    }
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Usuário logado:", userCredential.user);
        updateAuthUI(userCredential.user); // Atualiza a UI
    } catch (error) {
        console.error("Erro no login:", error);
        alert("Erro no login: " + error.message);
    }
});

btnLogout.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log("Usuário desconectado.");
        updateAuthUI(null); // Atualiza a UI
    } catch (error) {
        console.error("Erro ao sair:", error);
    }
});

// Monitor de estado de autenticação
onAuthStateChanged(auth, (user) => {
    usuarioAtual = user; // Define a variável global
    updateAuthUI(user); // Sempre atualiza a UI
});

/* ==== FIM SEÇÃO - AUTENTICAÇÃO ==== */


/* ==== INÍCIO SEÇÃO - CARREGAR DADOS DO FIREBASE ==== */
async function carregarDados() {
    if (!usuarioAtual) {
        return;
    }

    try {
        orcamentos = []; // Limpa os arrays antes de recarregar
        pedidos = [];
        const q = query(orcamentosPedidosRef, orderBy("numero"));
        const snapshot = await getDocs(q);

        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;

            if (data.tipo === 'orcamento') {
                orcamentos.push(data);
                // Correção:  Incrementa o número *após* carregar, não antes
                numeroOrcamento = Math.max(numeroOrcamento, parseInt(data.numero.split('/')[0]) + 1);
            } else if (data.tipo === 'pedido') {
                pedidos.push(data);
                numeroPedido = Math.max(numeroPedido, parseInt(data.numero.split('/')[0]) + 1);
            }
        });

        console.log("Dados carregados:", orcamentos, pedidos);
        mostrarOrcamentosGerados(); // Atualiza a exibição *após* carregar
        mostrarPedidosRealizados();

    } catch (error) {
        console.error("Erro ao carregar:", error);
        alert("Erro ao carregar dados. Veja o console.");
    }
}
/* ==== FIM SEÇÃO - CARREGAR DADOS DO FIREBASE ==== */

/* ==== INÍCIO SEÇÃO - FUNÇÕES AUXILIARES ==== */
function formatarMoeda(valor) {
    // Certifique-se de que valor é um número antes de formatar
    if (typeof valor !== 'number') {
      console.warn("formatarMoeda recebeu um valor não numérico:", valor);
      return "R$ 0,00";  // Ou outra string padrão apropriada
    }
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarEntradaMoeda(input) {
    let valor = input.value.replace(/\D/g, '');
    valor = (valor / 100).toFixed(2) + '';
    valor = valor.replace(".", ",");
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    input.value = valor === '0,00' ? '' : 'R$ ' + valor;
}

function converterMoedaParaNumero(valor) {
    if (typeof valor !== 'string') {
        console.warn('converterMoedaParaNumero recebeu um valor não string:', valor);
        return 0;
    }
    return parseFloat(valor.replace(/R\$\s?|\./g, '').replace(',', '.')) || 0;
}

function limparCamposMoeda() {
    const camposMoeda = ['valorFrete', 'valorOrcamento', 'total', 'entrada', 'restante', 'margemLucro', 'custoMaoDeObra',
                         'valorFreteEdicao', 'valorPedidoEdicao', 'totalEdicao', 'entradaEdicao', 'restanteEdicao', 'margemLucroEdicao', 'custoMaoDeObraEdicao'];
    camposMoeda.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.value = '0,00';
        }
    });
}

function adicionarProduto() {
    const tbody = document.querySelector("#tabelaProdutos tbody");
    const newRow = tbody.insertRow();

    const cellQuantidade = newRow.insertCell();
    const cellDescricao = newRow.insertCell();
    const cellValorUnit = newRow.insertCell();
    const cellValorTotal = newRow.insertCell();
    const cellAcoes = newRow.insertCell();

    cellQuantidade.innerHTML = '<input type="number" class="produto-quantidade" value="1" min="1" onchange="atualizarTotais()">';
    cellDescricao.innerHTML = '<input type="text" class="produto-descricao">';
    cellValorUnit.innerHTML = '<input type="text" class="produto-valor-unit" value="0,00" oninput="formatarEntradaMoeda(this)" onblur="atualizarTotais()">';
    cellValorTotal.textContent = formatarMoeda(0);
    cellAcoes.innerHTML = '<button type="button" onclick="excluirProduto(this)">Excluir</button>';
}

function adicionarProdutoEdicao() {
    const tbody = document.querySelector("#tabelaProdutosEdicao tbody");
    const newRow = tbody.insertRow();

    const cellQuantidade = newRow.insertCell();
    const cellDescricao = newRow.insertCell();
    const cellValorUnit = newRow.insertCell();
    const cellValorTotal = newRow.insertCell();
    const cellAcoes = newRow.insertCell();

    cellQuantidade.innerHTML = '<input type="number" class="produto-quantidade" value="1" min="1" onchange="atualizarTotaisEdicao()">';
    cellDescricao.innerHTML = '<input type="text" class="produto-descricao">';
    cellValorUnit.innerHTML = '<input type="text" class="produto-valor-unit" value="0,00" oninput="formatarEntradaMoeda(this)" onblur="atualizarTotaisEdicao()">';
    cellValorTotal.textContent = formatarMoeda(0);
    cellAcoes.innerHTML = '<button type="button" onclick="excluirProdutoEdicao(this)">Excluir</button>';
}

function excluirProduto(botaoExcluir) {
    const row = botaoExcluir.parentNode.parentNode;
    row.remove();
    atualizarTotais();
}

function excluirProdutoEdicao(botaoExcluir) {
    const row = botaoExcluir.parentNode.parentNode;
    row.remove();
    atualizarTotaisEdicao();
}

function atualizarTotais() {
    let valorTotalOrcamento = 0;
    const produtos = document.querySelectorAll("#tabelaProdutos tbody tr");

    produtos.forEach(row => {
        const quantidade = parseFloat(row.querySelector(".produto-quantidade").value);
        const valorUnit = converterMoedaParaNumero(row.querySelector(".produto-valor-unit").value);
        const valorTotal = quantidade * valorUnit;

        row.cells[3].textContent = formatarMoeda(valorTotal);
        valorTotalOrcamento += valorTotal;
    });

    const valorFrete = converterMoedaParaNumero(document.getElementById("valorFrete").value);
    const total = valorTotalOrcamento + valorFrete;

    document.getElementById("valorOrcamento").value = formatarMoeda(valorTotalOrcamento);
    document.getElementById("total").value = formatarMoeda(total);
}

function atualizarTotaisEdicao() {
    let valorTotalPedido = 0;

    document.querySelectorAll("#tabelaProdutosEdicao tbody tr").forEach(row => {
        const quantidade = parseFloat(row.querySelector(".produto-quantidade").value) || 0;
        const valorUnit = converterMoedaParaNumero(row.querySelector(".produto-valor-unit").value);
        const valorTotal = quantidade * valorUnit;

        row.cells[3].textContent = formatarMoeda(valorTotal);
        valorTotalPedido += valorTotal;
    });

    const valorFrete = converterMoedaParaNumero(document.getElementById("valorFreteEdicao").value);
    const valorPedido = converterMoedaParaNumero(document.getElementById("valorPedidoEdicao").value);
    const total = valorPedido + valorFrete;

    document.getElementById("totalEdicao").value = formatarMoeda(total);
    atualizarRestanteEdicao();
}

function atualizarRestanteEdicao() {
    const total = converterMoedaParaNumero(document.getElementById("totalEdicao").value);
    const entrada = converterMoedaParaNumero(document.getElementById("entradaEdicao").value);
    const custoMaoDeObra = converterMoedaParaNumero(document.getElementById("custoMaoDeObraEdicao").value);
    const restante = total - entrada - custoMaoDeObra;

    document.getElementById("restanteEdicao").value = formatarMoeda(restante);
}

function gerarNumeroFormatado(numero) {
    return numero.toString().padStart(4, '0') + '/' + anoAtual;
}

/* ==== FIM DA SEÇÃO - FUNÇÕES AUXILIARES ==== */

/* ==== INÍCIO SEÇÃO - SALVAR DADOS NO FIREBASE ==== */
async function salvarDados(dados, tipo) {
    if (!usuarioAtual) {
        alert("Você precisa estar autenticado.");
        return;
    }
    try {
        if (dados.id) {
             const docRef = doc(orcamentosPedidosRef, dados.id);
            await setDoc(docRef, dados, { merge: true }); // Atualiza
            console.log("Dados atualizados, ID:", dados.id);
        } else {
            const docRef = await addDoc(orcamentosPedidosRef, { ...dados, tipo }); // Cria
            console.log("Novos dados salvos, ID:", docRef.id);
            dados.id = docRef.id; // Importante:  Atribui o ID gerado ao objeto
        }

    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar. Veja o console.");
    }
}
/* ==== FIM SEÇÃO - SALVAR DADOS NO FIREBASE ==== */

/* ==== INÍCIO SEÇÃO - GERAÇÃO DE ORÇAMENTO ==== */
async function gerarOrcamento() {
     if (orcamentoEditando !== null) {
        alert("Você está no modo de edição. Clique em 'Atualizar Orçamento'.");
        return;
    }
  const dataOrcamento = document.getElementById("dataOrcamento").value;
    const dataValidade = document.getElementById("dataValidade").value;
    const orcamento = {
        numero: gerarNumeroFormatado(numeroOrcamento),
        dataOrcamento: dataOrcamento,
        dataValidade: dataValidade,
        cliente: document.getElementById("cliente").value,
        endereco: document.getElementById("endereco").value,
        tema: document.getElementById("tema").value,
        cidade: document.getElementById("cidade").value,
        telefone: document.getElementById("telefone").value,
        email: document.getElementById("email").value,
        cores: document.getElementById("cores").value,
        produtos: [],
        pagamento: Array.from(document.querySelectorAll('input[name="pagamento"]:checked')).map(el => el.value),
        valorFrete: converterMoedaParaNumero(document.getElementById("valorFrete").value),
        valorOrcamento: converterMoedaParaNumero(document.getElementById("valorOrcamento").value),
        total: converterMoedaParaNumero(document.getElementById("total").value),
        observacoes: document.getElementById("observacoes").value,
        pedidoGerado: false,
        numeroPedido: null,
         tipo: 'orcamento'
    };

    const produtos = document.querySelectorAll("#tabelaProdutos tbody tr");
    produtos.forEach(row => {
        orcamento.produtos.push({
             quantidade: parseFloat(row.querySelector(".produto-quantidade").value),
            descricao: row.querySelector(".produto-descricao").value,
            valorUnit: converterMoedaParaNumero(row.querySelector(".produto-valor-unit").value),
            valorTotal: converterMoedaParaNumero(row.cells[3].textContent)
        });
    });

    // Salvar no Firebase *antes* de atualizar a interface
    await salvarDados(orcamento, 'orcamento');
    orcamentos.push(orcamento); // Adiciona ao array local *após* salvar
    numeroOrcamento++; // Incrementa *após* salvar

    document.getElementById("orcamento").reset();
    limparCamposMoeda();
    document.querySelector("#tabelaProdutos tbody").innerHTML = "";

    alert("Orçamento gerado!");
    mostrarPagina('orcamentos-gerados');  // Mostra a página de orçamentos
    mostrarOrcamentosGerados();          // Atualiza a lista *imediatamente*
}

function exibirOrcamentoEmHTML(orcamento) {
    const janelaOrcamento = window.open('orcamento.html', '_blank');

    janelaOrcamento.addEventListener('load', () => {
        const conteudoOrcamento = janelaOrcamento.document.getElementById("conteudo-orcamento");

        const dataOrcamentoFormatada = orcamento.dataOrcamento.split('-').reverse().join('/');
        const dataValidadeFormatada = orcamento.dataValidade.split('-').reverse().join('/');

        const pagamentoFormatado = orcamento.pagamento.map(pag => {
            if (pag === 'pix') return 'PIX';
            if (pag === 'dinheiro') return 'Dinheiro';
            if (pag === 'cartaoCredito') return 'Cartão de Crédito';
            if (pag === 'cartaoDebito') return 'Cartão de Débito';
            return pag;
        }).join(', ');

        let html = `
            <h2>Orçamento Nº ${orcamento.numero}</h2>
            <div class="info-orcamento">
                <strong>Data do Orçamento:</strong> ${dataOrcamentoFormatada}<br>
                <strong>Data de Validade:</strong> ${dataValidadeFormatada}<br>
                <strong>Cliente:</strong> ${orcamento.cliente}<br>
                <strong>Endereço:</strong> ${orcamento.endereco}<br>
                <strong>Cidade:</strong> ${orcamento.cidade}<br>
                <strong>Telefone:</strong> ${orcamento.telefone}<br>
                <strong>E-mail:</strong> ${orcamento.email}<br>
                ${orcamento.tema ? `<strong>Tema:</strong> ${orcamento.tema}<br>` : ''}
                ${orcamento.cores ? `<strong>Cores:</strong> ${orcamento.cores}<br>` : ''}
            </div>
            <h3>Produtos</h3>
            <table>
                <thead>
                    <tr>
                        <th>Quantidade</th>
                        <th>Descrição do Produto</th>
                        <th>Valor Unit.</th>
                        <th>Valor Total</th>
                    </tr>
                </thead>
                <tbody>
        `;

        orcamento.produtos.forEach(produto => {
            html += `
                <tr>
                    <td>${produto.quantidade}</td>
                    <td>${produto.descricao}</td>
                    <td>${formatarMoeda(produto.valorUnit)}</td>
                    <td>${formatarMoeda(produto.valorTotal)}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            <div class="espaco-tabela"></div>
            <div class="info-orcamento">
                <strong>Pagamento:</strong> ${pagamentoFormatado}<br>
                <strong>Valor do Frete:</strong> ${formatarMoeda(orcamento.valorFrete)}<br>
                <strong>Valor do Orçamento:</strong> ${formatarMoeda(orcamento.valorOrcamento)}<br>
                <strong>Total:</strong> ${formatarMoeda(orcamento.total)}<br>
                ${orcamento.observacoes ? `<strong>Observações:</strong> ${orcamento.observacoes}<br>` : ''}
            </div>
        `;

        conteudoOrcamento.innerHTML = html;
    });
}

/* ==== FIM SEÇÃO - GERAÇÃO DE ORÇAMENTO ==== */

/* ==== INÍCIO SEÇÃO - ORÇAMENTOS GERADOS ==== */
function mostrarOrcamentosGerados() {
    const tbody = document.querySelector("#tabela-orcamentos tbody");
    tbody.innerHTML = ''; // Limpa a tabela

    orcamentos.forEach(orcamento => {
        const row = tbody.insertRow();
        const cellNumero = row.insertCell();
        const cellData = row.insertCell();
        const cellCliente = row.insertCell();
        const cellTotal = row.insertCell();
        const cellNumeroPedido = row.insertCell();

        cellNumero.textContent = orcamento.numero;
        cellData.textContent = orcamento.dataOrcamento;
        cellCliente.textContent = orcamento.cliente;
        cellTotal.textContent = formatarMoeda(orcamento.total);
        cellNumeroPedido.textContent = orcamento.numeroPedido || 'N/A';

        // Cria os botões dentro da célula de ações
        const cellAcoes = row.insertCell(); // Célula para os botões
         if (orcamento.pedidoGerado) {
            cellAcoes.innerHTML = `<button type="button" onclick="exibirOrcamentoEmHTML(orcamento)">Visualizar</button>`;
        } else {
            cellAcoes.innerHTML = `
                <button type="button" onclick="editarOrcamento('${orcamento.id}')">Editar</button>
                <button type="button" onclick="exibirOrcamentoEmHTML(orcamento)">Visualizar</button>
                <button type="button" onclick="gerarPedido('${orcamento.id}')">Gerar Pedido</button>
                <button type="button" onclick="excluirOrcamento('${orcamento.id}')">Excluir</button>
`; // Adicionado botão Excluir
        }
    });
}

function filtrarOrcamentos() {
    const dataInicio = document.getElementById('filtroDataInicioOrcamento').value;
    const dataFim = document.getElementById('filtroDataFimOrcamento').value;
    const numeroOrcamentoFiltro = parseInt(document.getElementById('filtroNumeroOrcamento').value);
    const anoOrcamentoFiltro = parseInt(document.getElementById('filtroAnoOrcamento').value);
    const clienteOrcamentoFiltro = document.getElementById('filtroClienteOrcamento').value.toLowerCase();

    const orcamentosFiltrados = orcamentos.filter(orcamento => {
        const [numOrcamento, anoOrcamento] = orcamento.numero.split('/');
        const dataOrcamento = new Date(orcamento.dataOrcamento);
        const nomeCliente = orcamento.cliente.toLowerCase();

        return (!dataInicio || dataOrcamento >= new Date(dataInicio)) &&
               (!dataFim || dataOrcamento <= new Date(dataFim)) &&
               (!numeroOrcamentoFiltro || parseInt(numOrcamento) === numeroOrcamentoFiltro) &&
               (!anoOrcamentoFiltro || parseInt(anoOrcamento) === anoOrcamentoFiltro) &&
               nomeCliente.includes(clienteOrcamentoFiltro);
    });

    atualizarListaOrcamentos(orcamentosFiltrados);
}

function atualizarListaOrcamentos(orcamentosFiltrados) {
 const tbody = document.querySelector("#tabela-orcamentos tbody");
    tbody.innerHTML = '';

    orcamentosFiltrados.forEach(orcamento => {
        const row = tbody.insertRow();
        const cellNumero = row.insertCell();
        const cellData = row.insertCell();
        const cellCliente = row.insertCell();
        const cellTotal = row.insertCell();
        const cellNumeroPedido = row.insertCell();

        cellNumero.textContent = orcamento.numero;
        cellData.textContent = orcamento.dataOrcamento;
        cellCliente.textContent = orcamento.cliente;
        cellTotal.textContent = formatarMoeda(orcamento.total);
        cellNumeroPedido.textContent = orcamento.numeroPedido || 'N/A';

         const cellAcoes = row.insertCell();
          if (orcamento.pedidoGerado) {
            cellAcoes.innerHTML = `<button type="button" onclick="exibirOrcamentoEmHTML(orcamento)">Visualizar</button>`;
          }else{
            cellAcoes.innerHTML = `
                <button type="button" onclick="editarOrcamento('${orcamento.id}')">Editar</button>
                <button type="button" onclick="exibirOrcamentoEmHTML(orcamento)">Visualizar</button>
                <button type="button" onclick="gerarPedido('${orcamento.id}')">Gerar Pedido</button>
                <button type="button" onclick="excluirOrcamento('${orcamento.id}')">Excluir</button>
`; // Adicionado botão Excluir
          }
    });
}

// Função para excluir orçamento
async function excluirOrcamento(orcamentoId) {
    if (!confirm("Tem certeza que deseja excluir este orçamento?")) {
        return;
    }

    try {
        await deleteDoc(doc(orcamentosPedidosRef, orcamentoId));

        // Remover do array local
        orcamentos = orcamentos.filter(o => o.id !== orcamentoId);
        mostrarOrcamentosGerados(); // Atualizar a exibição
        alert("Orçamento excluído com sucesso!");

    } catch (error) {
        console.error("Erro ao excluir orçamento:", error);
        alert("Erro ao excluir orçamento. Veja o console.");
    }
}

function editarOrcamento(orcamentoId) {
    const orcamento = orcamentos.find(o => o.id === orcamentoId);
    if (!orcamento) {
        alert("Orçamento não encontrado.");
        return;
    }

    if (orcamento.pedidoGerado) {
        alert("Não é possível editar um orçamento que já gerou um pedido.");
        return;
    }

    orcamentoEditando = orcamento.id; // Usando o ID agora

    document.getElementById("dataOrcamento").value = orcamento.dataOrcamento;
    document.getElementById("dataValidade").value = orcamento.dataValidade;
    document.getElementById("cliente").value = orcamento.cliente;
    document.getElementById("endereco").value = orcamento.endereco;
    document.getElementById("tema").value = orcamento.tema;
    document.getElementById("cidade").value = orcamento.cidade;
    document.getElementById("telefone").value = orcamento.telefone;
    document.getElementById("email").value = orcamento.email;
    document.getElementById("cores").value = orcamento.cores;
    document.getElementById("valorFrete").value = formatarMoeda(orcamento.valorFrete);
    document.getElementById("valorOrcamento").value = formatarMoeda(orcamento.valorOrcamento);
    document.getElementById("total").value = formatarMoeda(orcamento.total);
    document.getElementById("observacoes").value = orcamento.observacoes;

    const tbody = document.querySelector("#tabelaProdutos tbody");
    tbody.innerHTML = '';
    orcamento.produtos.forEach(produto => {
        const row = tbody.insertRow();
        const cellQuantidade = row.insertCell();
        const cellDescricao = row.insertCell();
        const cellValorUnit = row.insertCell();
        const cellValorTotal = row.insertCell();
        const cellAcoes = row.insertCell();

        cellQuantidade.innerHTML = `<input type="number" class="produto-quantidade" value="${produto.quantidade}" min="1" onchange="atualizarTotais()">`;
        cellDescricao.innerHTML = `<input type="text" class="produto-descricao" value="${produto.descricao}">`;
        cellValorUnit.innerHTML = `<input type="text" class="produto-valor-unit" value="${formatarMoeda(produto.valorUnit)}" oninput="formatarEntradaMoeda(this)" onblur="atualizarTotais()">`;
        cellValorTotal.textContent = formatarMoeda(produto.valorTotal);
        cellAcoes.innerHTML = '<button type="button" onclick="excluirProduto(this)">Excluir</button>';
    });

    document.querySelectorAll('input[name="pagamento"]').forEach(el => {
        el.checked = orcamento.pagamento.includes(el.value);
    });

    mostrarPagina('form-orcamento');
    document.getElementById("btnGerarOrcamento").style.display = "none";
    document.getElementById("btnAtualizarOrcamento").style.display = "inline-block";
}

async function atualizarOrcamento() {
  if (orcamentoEditando === null) {
        alert("Nenhum orçamento sendo editado.");
        return;
    }
     const orcamentoIndex = orcamentos.findIndex(o => o.id === orcamentoEditando);
    if (orcamentoIndex === -1) {
        alert("Orçamento não encontrado.");
        return;
    }

    const orcamentoAtualizado = {
        ...orcamentos[orcamentoIndex],
        dataOrcamento: document.getElementById("dataOrcamento").value,
        dataValidade: document.getElementById("dataValidade").value,
        cliente: document.getElementById("cliente").value,
        endereco: document.getElementById("endereco").value,
        tema: document.getElementById("tema").value,
        cidade: document.getElementById("cidade").value,
        telefone: document.getElementById("telefone").value,
        email: document.getElementById("email").value,
        cores: document.getElementById("cores").value,
        produtos: [], // Começa com um array vazio e preenche abaixo
        pagamento: Array.from(document.querySelectorAll('input[name="pagamento"]:checked')).map(el => el.value),
        valorFrete: converterMoedaParaNumero(document.getElementById("valorFrete").value),
        valorOrcamento: converterMoedaParaNumero(document.getElementById("valorOrcamento").value),
        total: converterMoedaParaNumero(document.getElementById("total").value),
        observacoes: document.getElementById("observacoes").value,
        tipo: 'orcamento' // Explicitamente define o tipo
    };

    const produtos = document.querySelectorAll("#tabelaProdutos tbody tr");
    produtos.forEach(row => {
        orcamentoAtualizado.produtos.push({ // Preenche o array de produtos
            quantidade: parseFloat(row.querySelector(".produto-quantidade").value),
            descricao: row.querySelector(".produto-descricao").value,
            valorUnit: converterMoedaParaNumero(row.querySelector(".produto-valor-unit").value),
            valorTotal: converterMoedaParaNumero(row.cells[3].textContent)
        });
    });

    orcamentos[orcamentoIndex] = orcamentoAtualizado;
    await salvarDados(orcamentoAtualizado, 'orcamento'); // Salva

     document.getElementById("orcamento").reset();
    limparCamposMoeda();
    document.querySelector("#tabelaProdutos tbody").innerHTML = "";

    alert("Orçamento atualizado!");
    orcamentoEditando = null;
    document.getElementById("btnGerarOrcamento").style.display = "inline-block";
    document.getElementById("btnAtualizarOrcamento").style.display = "none";

    mostrarPagina('orcamentos-gerados');
    mostrarOrcamentosGerados(); // Atualiza a exibição
}

/* ==== FIM SEÇÃO - ORÇAMENTOS GERADOS ==== */

/* ==== INÍCIO SEÇÃO - GERAR PEDIDO A PARTIR DO ORÇAMENTO ==== */
async function gerarPedido(orcamentoId) {
    const orcamento = orcamentos.find(o => o.id === orcamentoId);
    if (!orcamento) {
        alert("Orçamento não encontrado");
        return;
    }
    if (orcamento.pedidoGerado) {
        alert("Pedido já foi gerado.");
        return;
    }
        numero: gerarNumeroFormatado(numeroPedido),
        dataPedido: new Date().toISOString().split('T')[0],
        dataEntrega: orcamento.dataValidade,
        cliente: orcamento.cliente,
        endereco: orcamento.endereco,
        tema: orcamento.tema,
        cidade: orcamento.cidade,
        telefone: orcamento.telefone,
        email: orcamento.email,
        cores: orcamento.cores,
        pagamento: orcamento.pagamento,
        valorFrete: orcamento.valorFrete,
        valorOrcamento: orcamento.valorOrcamento,
        total: orcamento.total,
        observacoes: orcamento.observacoes,
        entrada: 0,
        restante: orcamento.total,
        margemLucro: converterMoedaParaNumero(String(orcamento.margemLucro)) || 0,
        custoMaoDeObra: converterMoedaParaNumero(String(orcamento.custoMaoDeObra)) || 0,
        valorPedido: orcamento.valorOrcamento,
        produtos: orcamento.produtos.map(p => ({
            ...p,
            valorTotal: p.quantidade * p.valorUnit
        })),
         tipo: 'pedido'
    };
    delete pedido.dataValidade;

    // Salvar *antes* de atualizar a interface, usando await
    await salvarDados(pedido, 'pedido');
    numeroPedido++; // Incrementa *após* salvar
    pedidos.push(pedido); // Adiciona ao array local *após* salvar

    orcamento.numeroPedido = pedido.numero; // Vincula
    orcamento.pedidoGerado = true;
    await salvarDados(orcamento, 'orcamento'); // Atualiza o orçamento

    alert("Pedido Nº " + pedido.numero + " gerado!");
    mostrarPagina('lista-pedidos'); // Mostra a página
    mostrarPedidosRealizados();      // Atualiza a lista *imediatamente*
    mostrarOrcamentosGerados(); // Atualiza orçamentos
}
/* ==== FIM SEÇÃO - GERAR PEDIDO A PARTIR DO ORÇAMENTO ==== */

/* ==== INÍCIO SEÇÃO - PEDIDOS REALIZADOS ==== */
function mostrarPedidosRealizados() {
    const tbody = document.querySelector("#tabela-pedidos tbody");
    tbody.innerHTML = '';

    pedidos.forEach(pedido => {
        const row = tbody.insertRow();
        const cellNumero = row.insertCell();
        const cellDataPedido = row.insertCell();
        const cellCliente = row.insertCell();
        const cellTotal = row.insertCell();


        cellNumero.textContent = pedido.numero;
        cellDataPedido.textContent = pedido.dataPedido;
        cellCliente.textContent = pedido.cliente;
        cellTotal.textContent = formatarMoeda(pedido.total);

        const cellAcoes = row.insertCell();
        cellAcoes.innerHTML = `
            <button type="button" onclick="editarPedido('${pedido.id}')">Editar</button>
            <button type="button" onclick="excluirPedido('${pedido.id}')">Excluir</button>
`; // Botão Excluir
    });
}

// Função para excluir pedido
async function excluirPedido(pedidoId) {
    if (!confirm("Tem certeza que deseja excluir este pedido?")) {
        return;
    }

    try {
        await deleteDoc(doc(orcamentosPedidosRef, pedidoId));

        //Remover array local
        pedidos = pedidos.filter(p => p.id !== pedidoId);
        mostrarPedidosRealizados(); // Atualizar exibição
        alert("Pedido excluído!");
     }catch (error){
       console.error("Erro:", error);
        alert("Erro. Veja console.");
     }
}

function filtrarPedidos() {
    const dataInicio = document.getElementById('filtroDataInicioPedido').value;
    const dataFim = document.getElementById('filtroDataFimPedido').value;
    const numeroPedidoFiltro = parseInt(document.getElementById('filtroNumeroPedido').value);
    const anoPedidoFiltro = parseInt(document.getElementById('filtroAnoPedido').value);
    const clientePedidoFiltro = document.getElementById('filtroClientePedido').value.toLowerCase();

    const pedidosFiltrados = pedidos.filter(pedido => {
        const [numPedido, anoPedido] = pedido.numero.split('/');
        const dataPedido = new Date(pedido.dataPedido);
        const nomeCliente = pedido.cliente.toLowerCase();

        return (!dataInicio || dataPedido >= new Date(dataInicio)) &&
               (!dataFim || dataPedido <= new Date(dataFim)) &&
               (!numeroPedidoFiltro || parseInt(numPedido) === numeroPedidoFiltro) &&
               (!anoPedidoFiltro || parseInt(anoPedido) === anoPedidoFiltro) &&
               nomeCliente.includes(clientePedidoFiltro);
    });

    atualizarListaPedidos(pedidosFiltrados);
}

function atualizarListaPedidos(pedidosFiltrados) {
 const tbody = document.querySelector("#tabela-pedidos tbody");
    tbody.innerHTML = '';

    pedidosFiltrados.forEach(pedido => {
         const row = tbody.insertRow();
        const cellNumero = row.insertCell();
        const cellDataPedido = row.insertCell();
        const cellCliente = row.insertCell();
        const cellTotal = row.insertCell();

        cellNumero.textContent = pedido.numero;
        cellDataPedido.textContent = pedido.dataPedido;
        cellCliente.textContent = pedido.cliente;
        cellTotal.textContent = formatarMoeda(pedido.total);

          const cellAcoes = row.insertCell();
          cellAcoes.innerHTML = `
            <button type="button" onclick="editarPedido('${pedido.id}')">Editar</button>
            <button type="button" onclick="excluirPedido('${pedido.id}')">Excluir</button>
`; // Botão Excluir
    });
}

function editarPedido(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) {
        alert("Pedido não encontrado.");
        return;
    }

    // Preencher o formulário de edição com os dados do pedido
    document.getElementById("dataPedidoEdicao").value = pedido.dataPedido;
    document.getElementById("dataEntregaEdicao").value = pedido.dataEntrega;
    document.getElementById("clienteEdicao").value = pedido.cliente;
    document.getElementById("enderecoEdicao").value = pedido.endereco;
    document.getElementById("temaEdicao").value = pedido.tema;
    document.getElementById("cidadeEdicao").value = pedido.cidade;
    document.getElementById("contatoEdicao").value = pedido.telefone;
    document.getElementById("coresEdicao").value = pedido.cores;
    document.getElementById("valorFreteEdicao").value = formatarMoeda(pedido.valorFrete);
    document.getElementById("valorPedidoEdicao").value = formatarMoeda(pedido.valorPedido);
    document.getElementById("valorPedidoEdicao").onblur = atualizarTotaisEdicao; // Chama atualizarTotaisEdicao ao sair do campo
    document.getElementById("totalEdicao").value = formatarMoeda(pedido.total);
    document.getElementById("entradaEdicao").value = formatarMoeda(pedido.entrada);
    document.getElementById("restanteEdicao").value = formatarMoeda(pedido.restante);
    document.getElementById("margemLucroEdicao").value = formatarMoeda(pedido.margemLucro);
    document.getElementById("custoMaoDeObraEdicao").value = formatarMoeda(pedido.custoMaoDeObra || 0);
    document.getElementById("observacoesEdicao").value = pedido.observacoes;

    // Preencher a tabela de produtos
    const tbody = document.querySelector("#tabelaProdutosEdicao tbody");
    tbody.innerHTML = '';
    pedido.produtos.forEach(produto => {
        const row = tbody.insertRow();
        const cellQuantidade = row.insertCell();
        const cellDescricao = row.insertCell();
        const cellValorUnit = row.insertCell();
        const cellValorTotal = row.insertCell();
        const cellAcoes = row.insertCell();

        cellQuantidade.innerHTML = `<input type="number" class="produto-quantidade" value="${produto.quantidade}" min="1" onchange="atualizarTotaisEdicao()">`;
        cellDescricao.innerHTML = `<input type="text" class="produto-descricao" value="${produto.descricao}">`;
        cellValorUnit.innerHTML = `<input type="text" class="produto-valor-unit" value="${formatarMoeda(produto.valorUnit)}" oninput="formatarEntradaMoeda(this)" onblur="atualizarTotaisEdicao()">`;
        cellValorTotal.textContent = formatarMoeda(produto.valorTotal);
        cellAcoes.innerHTML = '<button type="button" onclick="excluirProdutoEdicao(this)">Excluir</button>';
    });

    // Preencher checkboxes de pagamento (com verificação de existência)
    const pagamentoCheckboxes = document.querySelectorAll('input[name="pagamentoEdicao"]');
    pagamentoCheckboxes.forEach(el => el.checked = pedido.pagamento && pedido.pagamento.includes(el.value));

    // Mostrar a página de edição
    mostrarPagina('form-edicao-pedido');
}

async function atualizarPedido() {
   const pedidoIndex = pedidos.findIndex(p => p.id === pedido.id); // Find by ID
    if (pedidoIndex === -1) {
        alert("Pedido não encontrado.");
        return;
    }

    const pedidoAtualizado = {
        id: pedido.id, // Find by ID
        numero: document.getElementById("numeroEdicao").value, //Aqui estava errado
        dataPedido: document.getElementById("dataPedidoEdicao").value,
        dataEntrega: document.getElementById("dataEntregaEdicao").value,
        cliente: document.getElementById("clienteEdicao").value,
        endereco: document.getElementById("enderecoEdicao").value,
        tema: document.getElementById("temaEdicao").value,
        cidade: document.getElementById("cidadeEdicao").value,
        telefone: document.getElementById("contatoEdicao").value,
        cores: document.getElementById("coresEdicao").value,
        produtos: [],
        pagamento: Array.from(document.querySelectorAll('input[name="pagamentoEdicao"]:checked')).map(el => el.value),
        valorFrete: converterMoedaParaNumero(document.getElementById("valorFreteEdicao").value),
        valorPedido: converterMoedaParaNumero(document.getElementById("valorPedidoEdicao").value),
        total: converterMoedaParaNumero(document.getElementById("totalEdicao").value),
        entrada: converterMoedaParaNumero(document.getElementById("entradaEdicao").value),
        restante: converterMoedaParaNumero(document.getElementById("restanteEdicao").value),
        margemLucro: converterMoedaParaNumero(document.getElementById("margemLucroEdicao").value) || 0,
        custoMaoDeObra: converterMoedaParaNumero(document.getElementById("custoMaoDeObraEdicao").value) || 0,
        observacoes: document.getElementById("observacoesEdicao").value,
        tipo: 'pedido'
    };
      const produtos = document.querySelectorAll("#tabelaProdutosEdicao tbody tr");
    produtos.forEach(row => {
        pedidoAtualizado.produtos.push({
            quantidade: parseFloat(row.querySelector(".produto-quantidade").value),
            descricao: row.querySelector(".produto-descricao").value),
            valorUnit: converterMoedaParaNumero(row.querySelector(".produto-valor-unit").value),
            valorTotal: converterMoedaParaNumero(row.cells[3].textContent)
        });
    });

    pedidos[pedidoIndex] = pedidoAtualizado; // Atualiza o array local
    await salvarDados(pedidoAtualizado, 'pedido'); // Salva no Firebase

    alert("Pedido atualizado com sucesso!");
    mostrarPagina('lista-pedidos');
    mostrarPedidosRealizados();
}
/* ==== FIM SEÇÃO - PEDIDOS REALIZADOS ==== */

/* ==== INÍCIO SEÇÃO - RELATÓRIO ==== */
function filtrarPedidosRelatorio() {
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;

    const pedidosFiltrados = pedidos.filter(pedido => {
        const dataPedido = new Date(pedido.dataPedido);
        const inicio = dataInicio ? new Date(dataInicio) : new Date('1970-01-01');
        const fim = dataFim ? new Date(dataFim) : new Date('2100-01-01');

        return dataPedido >= inicio && dataPedido <= fim;
    });

    gerarRelatorio(pedidosFiltrados);
}

function gerarRelatorio(pedidosFiltrados) {
    let totalPedidos = 0;
    let totalFrete = 0;
    let totalMargemLucro = 0;
    let totalCustoMaoDeObra = 0;

    pedidosFiltrados.forEach(pedido => {
        totalPedidos += pedido.total;
        totalFrete += pedido.valorFrete;
        totalMargemLucro += converterMoedaParaNumero(String(pedido.margemLucro));
        totalCustoMaoDeObra += converterMoedaParaNumero(String(pedido.custoMaoDeObra));
    });

    const quantidadePedidos = pedidosFiltrados.length;

    const relatorioHTML = `
        <table class="relatorio-table">
            <thead>
                <tr>
                    <th>Total de Pedidos</th>
                    <th>Total de Frete</th>
                    <th>Total de Margem de Lucro</th>
                    <th>Total de Custo de Mão de Obra</th>
                    <th>Quantidade de Pedidos</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${formatarMoeda(totalPedidos)}</td>
                    <td>${formatarMoeda(totalFrete)}</td>
                    <td>${formatarMoeda(totalMargemLucro)}</td>
                    <td>${formatarMoeda(totalCustoMaoDeObra)}</td>
                    <td>${quantidadePedidos}</td>
                </tr>
            </tbody>
        </table>
    `;

    document.getElementById('relatorio-conteudo').innerHTML = relatorioHTML;
}

function gerarRelatorioXLSX() {
    const relatorioTable = document.querySelector('.relatorio-table');
    if (!relatorioTable) {
        alert('Erro: Tabela de relatório não encontrada. Gere o relatório primeiro.');
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.table_to_sheet(relatorioTable);
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
    XLSX.writeFile(wb, "relatorio_pedidos.xlsx");
}
/* ==== FIM SEÇÃO - RELATÓRIO ==== */

/* ==== INÍCIO SEÇÃO - FUNÇÕES DE CONTROLE DE PÁGINA ==== */
function mostrarPagina(idPagina) {
    const paginas = document.querySelectorAll('.pagina');
    paginas.forEach(pagina => {
        pagina.style.display = 'none';
    });

    document.getElementById(idPagina).style.display = 'block';
}

/* ==== FIM SEÇÃO - FUNÇÕES DE CONTROLE DE PÁGINA ==== */
    

