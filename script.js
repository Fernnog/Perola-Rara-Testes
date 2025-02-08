/* ==== INÍCIO SEÇÃO - VARIÁVEIS GLOBAIS ==== */
let orcamentos = [];
let pedidos = [];
let numeroOrcamento = 1;
let numeroPedido = 1;
const anoAtual = new Date().getFullYear();
let orcamentoEditando = null; // Variável para controlar se está editando um orçamento
let db; // Adicionando a variável db aqui
/* ==== FIM SEÇÃO - VARIÁVEIS GLOBAIS ==== */

/* ==== INÍCIO SEÇÃO - Inicialização do Firebase ==== */
const firebaseConfig = {
  apiKey: "AIzaSyCGCs3T-fV-PlalDSz_dqN1BvzoxSwjv5U",
  authDomain: "perola-rara-ae5bc.firebaseapp.com",
  projectId: "perola-rara-ae5bc",
  storageBucket: "perola-rara-ae5bc.firebasestorage.com",
  messagingSenderId: "968229137782",
  appId: "1:968229137782:web:682d4e0e851bf0e3f41e57",
  measurementId: "G-D0KYCNJW4P"
};

firebase.initializeApp(firebaseConfig);
db = firebase.firestore();
/* ==== FIM SEÇÃO - Inicialização do Firebase ==== */

/* ==== INÍCIO SEÇÃO - Funções de Autenticação ==== */
// Função para exibir mensagens (erro ou sucesso)
function showAuthMessage(message, isError = true) {
    const messageElement = document.getElementById('auth-message');
    messageElement.textContent = message;
    messageElement.style.color = isError ? 'red' : 'green';
}

// Função de Cadastro
async function registerUser(email, password) {
    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        // Usuário cadastrado com sucesso!
        console.log("Usuário cadastrado:", userCredential.user);
        showAuthMessage("Usuário cadastrado com sucesso!", false); // Mensagem de sucesso
        // Você *não* precisa fazer login automaticamente após o cadastro.
        // O onAuthStateChanged já vai detectar o novo usuário.

    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        showAuthMessage(getErrorMessage(error)); // Exibe a mensagem de erro
    }
}

// Função de Login
async function loginUser(email, password) {
    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        // Login com sucesso!
        console.log("Usuário logado:", userCredential.user);
        showAuthMessage("Login realizado com sucesso!", false);


    } catch (error) {
        console.error("Erro ao fazer login:", error);
        showAuthMessage(getErrorMessage(error));
    }
}
// Função de Logout
async function logoutUser() {
    try {
        await firebase.auth().signOut();
        // Logout com sucesso!
        console.log("Usuário deslogado");
        showAuthMessage("Logout realizado com sucesso!", false);

    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        showAuthMessage(getErrorMessage(error));
    }
}

// --- Tratamento de Erros (Firebase) ---
//Função para formatar mensagens de erro
function getErrorMessage(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return "Este email já está em uso.";
        case 'auth/invalid-email':
            return "Email inválido.";
        case 'auth/weak-password':
            return "A senha deve ter pelo menos 6 caracteres.";
        case 'auth/wrong-password':
            return "Senha incorreta.";
        case 'auth/user-not-found':
            return "Usuário não encontrado.";
        case 'auth/too-many-requests':
            return 'Muitas tentativas de login. Tente novamente mais tarde.';
        default:
            return "Erro: " + error.message; // Mensagem de erro genérica
    }
}
// --- Monitorando o Estado de Autenticação ---

firebase.auth().onAuthStateChanged(user => {
    const loginForm = document.getElementById('login-form');
    const loggedInMessage = document.getElementById('logged-in-message');
    const userEmailSpan = document.getElementById('user-email');

    if (user) {
        // Usuário está logado
        loginForm.style.display = 'none'; // Esconde o formulário
        loggedInMessage.style.display = 'block'; // Mostra a mensagem de logado
        userEmailSpan.textContent = user.email; // Exibe o email do usuário
        carregarDadosFirebase(); // Carrega os dados do Firebase
    } else {
        // Usuário não está logado
        loginForm.style.display = 'block'; // Mostra o formulário
        loggedInMessage.style.display = 'none'; // Esconde a mensagem
        //Limpa o painel de backup.
        const painel = document.getElementById('ultimoBackup');
        painel.innerHTML = 'Nenhum backup encontrado';
        //Não precisa chamar carregarDadosFirebase() aqui, pois não tem usuário logado.
    }
});


// --- Event Listeners (Login, Cadastro, Logout) ---

document.getElementById('btn-login').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    loginUser(email, password);
});

document.getElementById('btn-register').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    registerUser(email, password);
});

document.getElementById('btn-logout').addEventListener('click', logoutUser);

/* ==== FIM SEÇÃO - Funções de Autenticação ==== */

/* ==== INÍCIO SEÇÃO - Funções do Firebase (Salvar/Carregar) ==== */

async function salvarDadosFirebase() {
    try {
        const dadosParaSalvar = {
            orcamentos,
            pedidos,
            numeroOrcamento,
            numeroPedido,
            precificacao: { // Mesma estrutura que você usava para exportar
                materiais,
                maoDeObra,
                custosIndiretosPredefinidos,
                custosIndiretosAdicionais,
                produtos,
                taxaCredito,
                margemLucroPadrao,
                novoCustoIndiretoCounter
            }
        };

        // --- Autenticação (IMPORTANTE!) ---
        const user = firebase.auth().currentUser;
        if (!user) {
            alert("Nenhum usuário logado. Os dados não serão salvos."); // Ou trate de outra forma
            return; // Sai da função se não houver usuário logado
        }
        const userId = user.uid; // Obtém o ID do usuário logado


        await db.collection("dados").doc(userId).set(dadosParaSalvar); // Salva/Sobrescreve
        alert("Dados salvos com sucesso no Firebase!");

        // --- Atualiza Painel (opcional, se você ainda quiser) ---
        const agora = new Date();
        const dataFormatada = agora.toLocaleString('pt-BR'); //Formato DD/MM/AAAA, HH:mm:ss
        localStorage.setItem('ultimoBackup', JSON.stringify({ nomeArquivo: "backup_firebase", data: agora.toISOString() }));
        atualizarPainelUltimoBackup();


    } catch (error) {
        console.error("Erro ao salvar dados no Firebase:", error);
        alert("Erro ao salvar dados: " + error.message); // Mensagem de erro mais amigável
    }
}

async function carregarDadosFirebase() {
    try {
        // --- Autenticação (IMPORTANTE!) ---
        const user = firebase.auth().currentUser;
          if (!user) {
                //Se não tiver usuário logado, não carrega os dados, mas também NÃO limpa as variáveis.
                //Isso permite que os dados "locais" (da sessão) continuem existindo.
                console.log('Nenhum usuário logado. Carregando dados locais (se houver).');
                return; // Sai da função, mas *sem* limpar as variáveis
          }
        const userId = user.uid;

        const docRef = db.collection("dados").doc(userId);
        const doc = await docRef.get();

        if (doc.exists) {
            const dados = doc.data();
            //Carregamento dos dados principais.
            orcamentos = dados.orcamentos || [];
            pedidos = dados.pedidos || [];
            numeroOrcamento = dados.numeroOrcamento || 1;
            numeroPedido = dados.numeroPedido || 1;

            // Carrega os dados de precificação
            if (dados.precificacao) {
                const dadosPrecificacao = dados.precificacao;
                materiais = dadosPrecificacao.materiais || [];
                maoDeObra = dadosPrecificacao.maoDeObra || { salario: 0, horas: 220, valorHora: 0, incluirFerias13o: false, custoFerias13o: 0 };
                custosIndiretosPredefinidos = dadosPrecificacao.custosIndiretosPredefinidos || JSON.parse(JSON.stringify(custosIndiretosPredefinidosBase));
                custosIndiretosAdicionais = dadosPrecificacao.custosIndiretosAdicionais || [];
                produtos = dadosPrecificacao.produtos || [];
                taxaCredito = dadosPrecificacao.taxaCredito || {percentual: 5, incluir: false};
                margemLucroPadrao = dadosPrecificacao.margemLucroPadrao || 50;
                novoCustoIndiretoCounter = dadosPrecificacao.novoCustoIndiretoCounter || 0;
            }

            // --- Atualiza a Interface ---
            mostrarOrcamentosGerados();
            mostrarPedidosRealizados();
            alert("Dados carregados com sucesso do Firebase!");

        } else {
            // --- Se não houver dados do usuário no Firebase ---
            alert("Nenhum dado encontrado no Firebase para este usuário.");
              //NÃO faz nada. Mantém os dados da sessão, se existirem.
        }
    } catch (error) {
        console.error("Erro ao carregar dados do Firebase:", error);
        alert("Erro ao carregar dados: " + error.message);
    }
}
/* ==== FIM SEÇÃO - Funções do Firebase (Salvar/Carregar) ==== */

/* ==== INÍCIO SEÇÃO - Botão Limpar Página (Modificado) ==== */
async function limparPagina() {  //Agora é assíncrona
    if (confirm("Tem certeza que deseja limpar todos os dados da página? Esta ação é irreversível.")) {

		const user = firebase.auth().currentUser;

        // --- 1. Limpa os dados do Firebase (se houver usuário logado) ---
		if(user){
			try {
				const userId = user.uid;
				await db.collection("dados").doc(userId).delete(); // Apaga o documento do Firestore
				alert("Dados apagados do Firebase com sucesso!");
			} catch (error) {
				console.error("Erro ao apagar dados do Firebase:", error);
				alert("Erro ao apagar dados do Firebase: " + error.message);
				return; // Sai da função se houver erro ao apagar do Firebase
			}
		}

        // --- 2. Reseta as variáveis em memória ---
        orcamentos = [];
        pedidos = [];
        numeroOrcamento = 1;
        numeroPedido = 1;
        materiais = [];
		custosIndiretosPredefinidos = JSON.parse(JSON.stringify(custosIndiretosPredefinidosBase)); //Restaura o template.
        custosIndiretosAdicionais = [];
        produtos = [];
        maoDeObra = { salario: 0, horas: 220, valorHora: 0, incluirFerias13o: false, custoFerias13o: 0 };
        taxaCredito = {percentual: 5, incluir: false};
        margemLucroPadrao = 50;
        novoCustoIndiretoCounter = 0;


        // --- 3. Limpa a interface ---
        atualizarPainelUltimoBackup();
        // alert("Todos os dados foram apagados."); // Já mostrou o alert do Firebase
        mostrarPagina('form-orcamento');
        const formOrcamento = document.getElementById("orcamento");
        const formEdicaoPedido = document.getElementById("edicaoPedido");

        if (formOrcamento) {
            formOrcamento.reset();
            limparCamposMoeda();
            document.querySelector("#tabelaProdutos tbody").innerHTML = "";
        }

        if (formEdicaoPedido) {
            formEdicaoPedido.reset();
            limparCamposMoeda();
            document.querySelector("#tabelaProdutosEdicao tbody").innerHTML = "";
        }
        if (document.getElementById("orcamentos-gerados").style.display === 'block') {
            mostrarOrcamentosGerados();
        }
        if (document.getElementById("lista-pedidos").style.display === 'block') {
            mostrarPedidosRealizados();
        }
    }
}

/* ==== FIM SEÇÃO - Botão Limpar Página (Modificado) ==== */

/* ==== INÍCIO SEÇÃO - Chamadas Iniciais e Event Listeners ==== */
// Carrega os dados do Firebase ao carregar a página (se o usuário estiver logado)
document.addEventListener('DOMContentLoaded', () => {

	//Importante para carregar os custos indiretos predefinidos.
	carregarCustosIndiretosPredefinidos();

	//Verifica se tem usuário logado, e SÓ ENTÃO carrega os dados.
	firebase.auth().onAuthStateChanged(user => {
		if(user){
			carregarDadosFirebase(); // Carrega os dados do Firebase
		}
	});

	//O restante do seu código DOMContentLoaded...
	mostrarPagina('form-orcamento');
    atualizarPainelUltimoBackup();
});

//Associando as funções aos botões.
document.getElementById("btnGerarOrcamento").addEventListener('click', () => {
	//Antes de gerar o orçamento, salva no firebase (se tiver usuário logado).
	if(firebase.auth().currentUser){
		salvarDadosFirebase().then(() => { //Chama salvarDadosFirebase e ESPERA terminar.
			gerarOrcamento(); //SÓ ENTÃO chama gerarOrcamento().
		});
	} else{
		gerarOrcamento(); //Se não tiver usuário logado, apenas gera o orçamento local.
	}
});

document.getElementById("btnAtualizarOrcamento").addEventListener('click', () => {
    if(firebase.auth().currentUser){
        salvarDadosFirebase().then(atualizarOrcamento); //Salva e depois atualiza a interface.
    } else {
        atualizarOrcamento();
    }
});

//Para o botão de atualizar pedido
document.querySelector("#form-edicao-pedido button[type='button']").addEventListener('click', () => {
    if(firebase.auth().currentUser) {
        salvarDadosFirebase().then(atualizarPedido); //Mesma lógica: salva e *depois* atualiza.
    } else {
        atualizarPedido(); //Se não tiver login, apenas atualiza "localmente".
    }
});

/* ==== FIM SEÇÃO - Chamadas Iniciais e Event Listeners ==== */

/* ==== INÍCIO SEÇÃO - FUNÇÕES AUXILIARES ==== */
function formatarMoeda(valor) {
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
    return parseFloat(valor.replace(/R\$\s?|\./g, '').replace(',', '.')) || 0;
}

function limparCamposMoeda() {
    const camposMoeda = ['valorFrete', 'valorOrcamento', 'total', 'entrada', 'restante', 'lucro',
                         'valorFreteEdicao', 'valorPedidoEdicao', 'totalEdicao', 'entradaEdicao', 'restanteEdicao', 'lucroEdicao'];
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
    let valorTotalPedido = 0; // Soma dos totais da tabela de produtos

    document.querySelectorAll("#tabelaProdutosEdicao tbody tr").forEach(row => {
        const quantidade = parseFloat(row.querySelector(".produto-quantidade").value) || 0;
        const valorUnit = converterMoedaParaNumero(row.querySelector(".produto-valor-unit").value);
        const valorTotal = quantidade * valorUnit;

        row.cells[3].textContent = formatarMoeda(valorTotal);
        valorTotalPedido += valorTotal;
    });

    // NÃO atualizar valorPedidoEdicao aqui:
    // document.getElementById("valorPedidoEdicao").value = formatarMoeda(valorTotalPedido);

    const valorFrete = converterMoedaParaNumero(document.getElementById("valorFreteEdicao").value);
    const valorPedido = converterMoedaParaNumero(document.getElementById("valorPedidoEdicao").value); // Pega o valor digitado pelo usuário
    const total = valorPedido + valorFrete; // Usa o valor digitado em valorPedidoEdicao

    document.getElementById("totalEdicao").value = formatarMoeda(total);
    atualizarRestanteEdicao();
}

function atualizarRestanteEdicao() {
    const total = converterMoedaParaNumero(document.getElementById("totalEdicao").value);
    const entrada = converterMoedaParaNumero(document.getElementById("entradaEdicao").value);
    const restante = total - entrada;

    document.getElementById("restanteEdicao").value = formatarMoeda(restante);
}

function gerarNumeroFormatado(numero) {
    return numero.toString().padStart(4, '0') + '/' + anoAtual;
}

/* ==== FIM DA SEÇÃO - FUNÇÕES AUXILIARES ==== */

/* ==== INÍCIO SEÇÃO - GERAÇÃO DE ORÇAMENTO ==== */
function gerarOrcamento() {
    // Verifica se está no modo de edição
    if (orcamentoEditando !== null) {
        alert("Você está no modo de edição de orçamento. Clique em 'Atualizar Orçamento' para salvar as alterações.");
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
        numeroPedido: null
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

    orcamentos.push(orcamento);
    numeroOrcamento++;

    exibirOrcamentoEmHTML(orcamento);

    //Removido daqui, agora salva no firebase ao clicar nos botões.
    // exportarDados();
    // salvarDados();

    document.getElementById("orcamento").reset();
    limparCamposMoeda();
    document.querySelector("#tabelaProdutos tbody").innerHTML = "";

    alert("Orçamento gerado com sucesso!");
}

function exibirOrcamentoEmHTML(orcamento) {
    const janelaOrcamento = window.open('orcamento.html', '_blank');

    janelaOrcamento.addEventListener('load', () => {
        const conteudoOrcamento = janelaOrcamento.document.getElementById("conteudo-orcamento");

        // Formatar data do orçamento para DD/MM/AAAA
        const dataOrcamentoFormatada = orcamento.dataOrcamento.split('-').reverse().join('/');

        // Formatar data de validade para DD/MM/AAAA
        const dataValidadeFormatada = orcamento.dataValidade.split('-').reverse().join('/');

        // Formatar opções de pagamento
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
    tbody.innerHTML = '';

    orcamentos.forEach(orcamento => {
        const row = tbody.insertRow();
        const cellNumero = row.insertCell();
        const cellData = row.insertCell();
        const cellCliente = row.insertCell();
        const cellTotal = row.insertCell();
        const cellNumeroPedido = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNumero.textContent = orcamento.numero;
        cellData.textContent = orcamento.dataOrcamento;
        cellCliente.textContent = orcamento.cliente;
        cellTotal.textContent = formatarMoeda(orcamento.total);
        cellNumeroPedido.textContent = orcamento.numeroPedido || 'N/A';

        if (orcamento.pedidoGerado) {
            cellAcoes.innerHTML = `<button type="button" onclick="exibirOrcamentoEmHTML(orcamentos.find(o => o.numero === '${orcamento.numero}'))">Visualizar</button>`;
        } else {
            cellAcoes.innerHTML = `<button type="button" onclick="editarOrcamento('${orcamento.numero}')">Editar</button>
                                   <button type="button" onclick="exibirOrcamentoEmHTML(orcamentos.find(o => o.numero === '${orcamento.numero}'))">Visualizar</button>
                                   <button type="button" onclick="gerarPedido('${orcamento.numero}')">Gerar Pedido</button>`;
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
        const cellAcoes = row.insertCell();

        cellNumero.textContent = orcamento.numero;
        cellData.textContent = orcamento.dataOrcamento;
        cellCliente.textContent = orcamento.cliente;
        cellTotal.textContent = formatarMoeda(orcamento.total);
        cellNumeroPedido.textContent = orcamento.numeroPedido || 'N/A';

        if (orcamento.pedidoGerado) {
            cellAcoes.innerHTML = `<button type="button" onclick="exibirOrcamentoEmHTML(orcamentos.find(o => o.numero === '${orcamento.numero}'))">Visualizar</button>`;
        } else {
            cellAcoes.innerHTML = `<button type="button" onclick="editarOrcamento('${orcamento.numero}')">Editar</button>
                                   <button type="button" onclick="exibirOrcamentoEmHTML(orcamentos.find(o => o.numero === '${orcamento.numero}'))">Visualizar</button>
                                   <button type="button" onclick="gerarPedido('${orcamento.numero}')">Gerar Pedido</button>`;
        }
    });
}

function editarOrcamento(numeroOrcamento) {
    const orcamento = orcamentos.find(o => o.numero === numeroOrcamento);
    if (!orcamento) {
        alert("Orçamento não encontrado.");
        return;
    }

    if (orcamento.pedidoGerado) {
        alert("Não é possível editar um orçamento que já gerou um pedido.");
        return;
    }

    orcamentoEditando = orcamento.numero;

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

function atualizarOrcamento() {
    if (orcamentoEditando === null) {
        alert("Nenhum orçamento está sendo editado.");
        return;
    }

    const orcamentoIndex = orcamentos.findIndex(o => o.numero === orcamentoEditando);
    if (orcamentoIndex === -1) {
        alert("Orçamento não encontrado.");
        return;
    }

    orcamentos[orcamentoIndex] = {
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
        produtos: [],
        pagamento: Array.from(document.querySelectorAll('input[name="pagamento"]:checked')).map(el => el.value),
        valorFrete: converterMoedaParaNumero(document.getElementById("valorFrete").value),
        valorOrcamento: converterMoedaParaNumero(document.getElementById("valorOrcamento").value),
        total: converterMoedaParaNumero(document.getElementById("total").value),
        observacoes: document.getElementById("observacoes").value,
    };

    const produtos = document.querySelectorAll("#tabelaProdutos tbody tr");
    produtos.forEach(row => {
        orcamentos[orcamentoIndex].produtos.push({
            quantidade: parseFloat(row.querySelector(".produto-quantidade").value),
            descricao: row.querySelector(".produto-descricao").value,
            valorUnit: converterMoedaParaNumero(row.querySelector(".produto-valor-unit").value),
            valorTotal: converterMoedaParaNumero(row.cells[3].textContent)
        });
    });

    //Removido daqui, agora salva no firebase
    // exportarDados();
    // salvarDados();

    document.getElementById("orcamento").reset();
    limparCamposMoeda();
    document.querySelector("#tabelaProdutos tbody").innerHTML = "";

    alert("Orçamento atualizado com sucesso!");

    orcamentoEditando = null;
    document.getElementById("btnGerarOrcamento").style.display = "inline-block";
    document.getElementById("btnAtualizarOrcamento").style.display = "none";

    mostrarPagina('orcamentos-gerados');
    mostrarOrcamentosGerados();
}
/* ==== FIM SEÇÃO - ORÇAMENTOS GERADOS ==== */

/* ==== INÍCIO SEÇÃO - GERAR PEDIDO A PARTIR DO ORÇAMENTO ==== */
function gerarPedido(numeroOrcamento) {
    const orcamento = orcamentos.find(o => o.numero === numeroOrcamento);
    if (!orcamento) {
        alert("Orçamento não encontrado.");
        return;
    }

    if (orcamento.pedidoGerado) {
        alert("Um pedido já foi gerado para este orçamento.");
        return;
    }

    const pedido = {
        numero: gerarNumeroFormatado(numeroPedido),
        ...orcamento, // Isso copia todas as propriedades do orçamento
        dataPedido: new Date().toISOString().split('T')[0],
        dataEntrega: orcamento.dataValidade,
        entrada: 0, // Valor inicial da entrada
        restante: orcamento.total, // Valor inicial do restante (igual ao total do orçamento)
        lucro: 0, // Valor inicial do lucro
        valorPedido: orcamento.valorOrcamento, // Adiciona o valor do orçamento como valor do pedido
        produtos: orcamento.produtos.map(p => ({
            ...p,
            valorTotal: p.quantidade * p.valorUnit
        })),
        observacoes: orcamento.observacoes // COPIANDO OBSERVAÇÕES DO ORÇAMENTO PARA O PEDIDO
    };

    delete pedido.dataValidade;

    orcamento.numeroPedido = pedido.numero;

    pedidos.push(pedido);
    numeroPedido++;

    orcamento.pedidoGerado = true;

    //Removido daqui. Agora salva no Firebase.
    // exportarDados();
    // salvarDados();

    alert(`Pedido Nº ${pedido.numero} gerado com sucesso a partir do orçamento Nº ${numeroOrcamento}!`);
    mostrarPagina('lista-pedidos');
    mostrarPedidosRealizados();
    mostrarOrcamentosGerados();
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
        const cellAcoes = row.insertCell();

        cellNumero.textContent = pedido.numero;
        cellDataPedido.textContent = pedido.dataPedido;
        cellCliente.textContent = pedido.cliente;
        cellTotal.textContent = formatarMoeda(pedido.total);
        cellAcoes.innerHTML = `<button type="button" onclick="editarPedido('${pedido.numero}')">Editar</button>`;
    });
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
        const cellAcoes = row.insertCell();

        cellNumero.textContent = pedido.numero;
        cellDataPedido.textContent = pedido.dataPedido;
        cellCliente.textContent = pedido.cliente;
        cellTotal.textContent = formatarMoeda(pedido.total);
        cellAcoes.innerHTML = `<button type="button" onclick="editarPedido('${pedido.numero}')">Editar</button>`;
    });
}

function editarPedido(numeroPedido) {
    const pedido = pedidos.find(p => p.numero === numeroPedido);
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
    document.getElementById("lucroEdicao").value = formatarMoeda(pedido.lucro);
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

function atualizarPedido() {
    // CORRIGINDO OBTENÇÃO DO NÚMERO DO PEDIDO
    const numeroPedido = document.getElementById("tabela-pedidos").querySelector('tbody tr td:first-child').textContent;
    const pedidoIndex = pedidos.findIndex(p => p.numero === numeroPedido);

    if (pedidoIndex === -1) {
        alert("Pedido não encontrado.");
        return;
    }

    const pedidoAtualizado = {
        // ADICIONANDO O NÚMERO DO PEDIDO
        numero: numeroPedido,
        dataPedido: document.getElementById("dataPedidoEdicao").value,
        dataEntrega: document.getElementById("dataEntregaEdicao").value,
        cliente: document.getElementById("clienteEdicao").value,
        endereco: document.getElementById("enderecoEdicao").value,
        tema: document.getElementById("temaEdicao").value,
        cidade: document.getElementById("cidadeEdicao").value,
        // CORRIGINDO NOME DO CAMPO (ERA contatoEdicao)
        telefone: document.getElementById("contatoEdicao").value,
        cores: document.getElementById("coresEdicao").value,
        produtos: [],
        // REMOVENDO O CAMPO entrega
        pagamento: Array.from(document.querySelectorAll('input[name="pagamentoEdicao"]:checked')).map(el => el.value),
        valorFrete: converterMoedaParaNumero(document.getElementById("valorFreteEdicao").value),
        valorPedido: converterMoedaParaNumero(document.getElementById("valorPedidoEdicao").value),
        total: converterMoedaParaNumero(document.getElementById("totalEdicao").value),
        entrada: converterMoedaParaNumero(document.getElementById("entradaEdicao").value),
        restante: converterMoedaParaNumero(document.getElementById("restanteEdicao").value),
        lucro: converterMoedaParaNumero(document.getElementById("lucroEdicao").value),
        observacoes: document.getElementById("observacoesEdicao").value
    };

    const produtos = document.querySelectorAll("#tabelaProdutosEdicao tbody tr");
    produtos.forEach(row => {
        pedidoAtualizado.produtos.push({
            quantidade: parseFloat(row.querySelector(".produto-quantidade").value),
            descricao: row.querySelector(".produto-descricao").value,
            valorUnit: converterMoedaParaNumero(row.querySelector(".produto-valor-unit").value),
            valorTotal: converterMoedaParaNumero(row.cells[3].textContent)
        });
    });

    // ATUALIZANDO O PEDIDO NA LISTA
    pedidos[pedidoIndex] = pedidoAtualizado;

    //removido daqui, agora salva no firebase
    // exportarDados();
    // salvarDados();

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
        const inicio = dataInicio ? new Date(dataInicio) : new Date('1970-01-01'); // Data mínima
        const fim = dataFim ? new Date(dataFim) : new Date('2100-01-01'); // Data máxima

        return dataPedido >= inicio && dataPedido <= fim;
    });

    gerarRelatorio(pedidosFiltrados);
}

function gerarRelatorio(pedidosFiltrados) {
    let totalPedidos = 0;
    let totalFrete = 0;
    let totalLucro = 0;

    pedidosFiltrados.forEach(pedido => {
        totalPedidos += pedido.total;
        totalFrete += pedido.valorFrete;
        totalLucro += pedido.lucro;
    });

    const quantidadePedidos = pedidosFiltrados.length;

    const relatorioHTML = `
        <table class="relatorio-table">
            <thead>
                <tr>
                    <th>Total de Pedidos</th>
                    <th>Total de Frete</th>
                    <th>Total de Lucro</th>
                    <th>Quantidade de Pedidos</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${formatarMoeda(totalPedidos)}</td>
                    <td>${formatarMoeda(totalFrete)}</td>
                    <td>${formatarMoeda(totalLucro)}</td>
                    <td>${quantidadePedidos}</td>
                </tr>
            </tbody>
        </table>
    `;

    document.getElementById('relatorio-conteudo').innerHTML = relatorioHTML;
}

function gerarRelatorioXLSX() {
    // Criar uma nova pasta de trabalho
    const wb = XLSX.utils.book_new();

    // Criar uma nova planilha
    const ws = XLSX.utils.table_to_sheet(document.querySelector('.relatorio-table'));

    // Adicionar a planilha à pasta de trabalho
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");

    // Gerar o arquivo XLSX e iniciar o download
    XLSX.writeFile(wb, "relatorio_pedidos.xlsx");
}
/* ==== FIM SEÇÃO - RELATÓRIO ==== */

/* ==== INÍCIO SEÇÃO - IMPORTAR/EXPORTAR ==== */
//Removendo as funções antigas de exportar/importar

/* ==== FIM SEÇÃO - IMPORTAR/EXPORTAR ==== */

/* ==== INÍCIO SEÇÃO - PAINEL ÚLTIMO BACKUP ==== */
function atualizarPainelUltimoBackup() {
    const ultimoBackup = JSON.parse(localStorage.getItem('ultimoBackup'));
    const painel = document.getElementById('ultimoBackup');

    if (ultimoBackup) {
        const data = new Date(ultimoBackup.data);
        const dataFormatada = data.toLocaleString('pt-BR');

        painel.innerHTML = `Último backup: ${dataFormatada}`; // Atualiza a interface
    } else {
        painel.innerHTML = 'Nenhum backup encontrado';
    }
}

/* ==== FIM SEÇÃO - PAINEL ÚLTIMO BACKUP ==== */

/* ==== INÍCIO SEÇÃO - FUNÇÕES DE CONTROLE DE PÁGINA ==== */
function mostrarPagina(idPagina) {
    const paginas = document.querySelectorAll('.pagina');
    paginas.forEach(pagina => {
        pagina.style.display = 'none';
    });

    document.getElementById(idPagina).style.display = 'block';
}

//Removendo as funções antigas de salvar/carregar
/* ==== FIM SEÇÃO - FUNÇÕES DE CONTROLE DE PÁGINA ==== */
