/* ==== INÍCIO SEÇÃO - VARIÁVEIS GLOBAIS ==== */
let orcamentos = [];
let pedidos = [];
let numeroOrcamento = 1;
let numeroPedido = 1;
const anoAtual = new Date().getFullYear();
let orcamentoEditando = null; // Variável para controlar se está editando um orçamento
let usuarioLogado = null;  // Variável global para armazenar o usuário logado
let custosIndiretosPredefinidosBase = []; // Inicialização da variável global
/* ==== FIM SEÇÃO - VARIÁVEIS GLOBAIS ==== */

/* ==== INÍCIO SEÇÃO - CARREGAR DADOS DO FIREBASE COM AUTENTICAÇÃO ==== */
document.addEventListener('DOMContentLoaded', () => {
    // Verifica o estado de autenticação ao carregar a página
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuário está logado
            usuarioLogado = user;
            ocultarLogin(); // Oculta a tela de login
            carregarDados(); // Carrega dados do Firebase
        } else {
            // Usuário não está logado
            usuarioLogado = null;
            mostrarLogin(); // Mostra a tela de login
        }
    });
    atualizarPainelUltimoBackup();
    mostrarPagina('form-orcamento'); // Mostra a página inicial (formulário de orçamento)
});
/* ==== FIM SEÇÃO - CARREGAR DADOS DO FIREBASE COM AUTENTICAÇÃO ==== */

/* ==== INÍCIO SEÇÃO - AUTENTICAÇÃO FIREBASE ==== */
// Função para mostrar a seção de login
function mostrarLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.querySelector('.container').style.display = 'none'; // Esconde o container principal
}

// Função para ocultar a seção de login
function ocultarLogin() {
    document.getElementById('login-section').style.display = 'none';
    document.querySelector('.container').style.display = 'block'; // Mostra o container principal
}

// Função para lidar com o envio do formulário de login
function handleLogin(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageDiv = document.getElementById('login-message');

    messageDiv.textContent = ''; // Limpa mensagens anteriores
    messageDiv.classList.remove('error', 'success'); // Remove classes de erro/sucesso

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login bem-sucedido
            usuarioLogado = userCredential.user;
            messageDiv.textContent = 'Login realizado com sucesso!';
            messageDiv.classList.add('success');
            ocultarLogin();
            carregarDados(); // Carrega os dados do Firebase após o login
            atualizarPainelUltimoBackup();
        })
        .catch((error) => {
            // Erro no login
            messageDiv.textContent = 'Erro no login: ' + error.message;
            messageDiv.classList.add('error');
        });
}

// Função para criar uma nova conta
function criarConta() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageDiv = document.getElementById('login-message');

    messageDiv.textContent = '';
    messageDiv.classList.remove('error', 'success');

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Conta criada com sucesso
            usuarioLogado = userCredential.user;
            messageDiv.textContent = 'Conta criada com sucesso!  Você já está logado.';
            messageDiv.classList.add('success');
            ocultarLogin();
             atualizarPainelUltimoBackup();
            // Não precisa carregar dados aqui, pois é uma conta nova
        })
        .catch((error) => {
            // Erro ao criar conta
            messageDiv.textContent = 'Erro ao criar conta: ' + error.message;
            messageDiv.classList.add('error');
        });
}

// Adiciona um listener para o envio do formulário de login
document.getElementById('login-form').addEventListener('submit', handleLogin);

// Adiciona um listener para o botão de criar conta
document.getElementById('btn-create-account').addEventListener('click', criarConta);

/* ==== FIM SEÇÃO - AUTENTICAÇÃO FIREBASE ==== */

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

    salvarDadosFirebase();

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

    salvarDadosFirebase(); // Salva no Firebase após atualizar

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

    salvarDadosFirebase(); // Salva no Firebase após gerar o pedido

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

    salvarDadosFirebase(); // Salva no Firebase após atualizar o pedido

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

/* ==== INÍCIO SEÇÃO - BACKUP FIREBASE (substitui exportarDados e importarDados) ==== */
function salvarDadosFirebase() {
    if (!usuarioLogado) {
        alert('Você precisa estar logado para salvar os dados.');
        return;
    }

    const dadosParaSalvar = {
        orcamentos,
        pedidos,
        numeroOrcamento,
        numeroPedido,
        //Dados da precificação:
        materiais,
        maoDeObra,
        custosIndiretosPredefinidos,
        custosIndiretosAdicionais,
        produtos,
        taxaCredito,
        ultimoBackup: new Date().toISOString()
    };

    database.ref('usuarios/' + usuarioLogado.uid).set(dadosParaSalvar)
        .then(() => {
            atualizarPainelUltimoBackup();
            console.log('Dados salvos no Firebase para o usuário:', usuarioLogado.email);
        })
        .catch((error) => {
            console.error("Erro ao salvar dados no Firebase:", error);
        });
}

function carregarDados() {
    if (!usuarioLogado) {
        console.log('Nenhum usuário logado.');
        return;
    }

    database.ref('usuarios/' + usuarioLogado.uid).once('value')
        .then((snapshot) => {
            const dados = snapshot.val();
            if (dados) {
                orcamentos = dados.orcamentos || [];
                pedidos = dados.pedidos || [];
                numeroOrcamento = dados.numeroOrcamento || 1;
                numeroPedido = dados.numeroPedido || 1;

                //Dados da precificação
                materiais = dados.materiais || [];
                maoDeObra = dados.maoDeObra || { salario: 0, horas: 220, valorHora: 0, incluirFerias13o: false, custoFerias13o: 0 };
                custosIndiretosPredefinidos = dados.custosIndiretosPredefinidos || JSON.parse(JSON.stringify(custosIndiretosPredefinidosBase));
                custosIndiretosAdicionais = dados.custosIndiretosAdicionais || [];
                produtos = dados.produtos || [];
                taxaCredito = dados.taxaCredito || {percentual: 6, incluir: false};


                mostrarOrcamentosGerados();
                mostrarPedidosRealizados();
                atualizarPainelUltimoBackup();

                //Precificação
                atualizarTabelaMateriaisInsumos();
                carregarCustosIndiretosPredefinidos();
                atualizarTabelaCustosIndiretos();
                atualizarTabelaProdutosCadastrados();


                console.log('Dados carregados do Firebase para o usuário:', usuarioLogado.email);
            } else {
                console.log('Nenhum dado encontrado no Firebase para este usuário.');
                // Se quiser carregar dados locais como fallback (opcional):
                // carregarDadosLocais();
            }
        })
        .catch((error) => {
            console.error("Erro ao carregar dados do Firebase:", error);
        });
}

/* ==== FIM SEÇÃO - BACKUP FIREBASE ==== */

/* ==== INÍCIO SEÇÃO - PAINEL ÚLTIMO BACKUP ==== */
function atualizarPainelUltimoBackup() {
    const painel = document.getElementById('ultimoBackupFirebase');

    if (usuarioLogado) {
        database.ref('usuarios/' + usuarioLogado.uid + '/ultimoBackup').once('value')
            .then((snapshot) => {
                const ultimoBackup = snapshot.val();
                if (ultimoBackup) {
                    const data = new Date(ultimoBackup);
                    const dataFormatada = `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()} ${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
                    painel.innerHTML = `Último backup: ${dataFormatada} (Firebase)`;
                } else {
                    painel.innerHTML = 'Nenhum backup recente.';
                }
            });
    } else {
        painel.innerHTML = 'Faça login para ver o último backup.';
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

// REMOVIDA A FUNÇÃO limparPagina()
/* ==== FIM SEÇÃO - FUNÇÕES DE CONTROLE DE PÁGINA ==== */
```

**`precificacao.js`:**

```javascript
/* Variáveis globais */
let materiais = [];
let maoDeObra = { salario: 0, horas: 220, valorHora: 0, incluirFerias13o: false, custoFerias13o: 0 }; // Horas padrão 220h
let custosIndiretosPredefinidosBase = [ // This is the base template, never modified
    { descricao: "Energia elétrica", valorMensal: 0 },
    { descricao: "Água", valorMensal: 0 },
    { descricao: "Gás", valorMensal: 0 },
    { descricao: "Aluguel do espaço", valorMensal: 0 },
    { descricao: "Depreciação de máquinas e equipamentos", valorMensal: 0 },
    { descricao: "Manutenção predial e de equipamentos", valorMensal: 0 },
    { descricao: "Despesas com segurança", valorMensal: 0 },
    { descricao: "Limpeza e conservação", valorMensal: 0 },
    { descricao: "Material de escritório", valorMensal: 0 },
    { descricao: "Impostos e taxas indiretos", valorMensal: 0 },
    { descricao: "Marketing institucional", valorMensal: 0 },
    { descricao: "Transporte e logística", valorMensal: 0 },
    { descricao: "Despesas com utilidades", valorMensal: 0 },
    { descricao: "Demais custos administrativos", valorMensal: 0 }
];
let custosIndiretosPredefinidos = JSON.parse(JSON.stringify(custosIndiretosPredefinidosBase)); // Working copy, modified by user inputs
let custosIndiretosAdicionais = [];
let produtos = [];
let modoEdicaoMaoDeObra = false;
let itemEdicaoCustoIndireto = null;
let novoCustoIndiretoCounter = 0; // Contador para IDs únicos de custos indiretos adicionais
let taxaCredito = {percentual: 6, incluir: false}; //Objeto para taxa de crédito


/* Formatação de valores em moeda */
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* Exibir a subpágina desejada */
function mostrarSubMenu(submenuId) {
    const conteudos = ['materiais-insumos', 'mao-de-obra', 'custos-indiretos', 'produtos-cadastrados', 'calculo-precificacao'];
    conteudos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = 'none';
        }
    });
    const submenu = document.getElementById(submenuId);
    if (submenu) {
        submenu.style.display = 'block';
    }
}

/* Limpar formulário */
function limparFormulario(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

/* Monitorar os radios para exibir os campos corretos */
document.querySelectorAll('input[name="tipo-material"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const camposComprimento = document.getElementById('campos-comprimento');
        const camposLitro = document.getElementById('campos-litro');
        const camposQuilo = document.getElementById('campos-quilo');
        const camposArea = document.getElementById('campos-area');

        camposComprimento.style.display = 'none';
        camposLitro.style.display = 'none';
        camposQuilo.style.display = 'none';
        camposArea.style.display = 'none';

        if (this.value === "comprimento") {
            camposComprimento.style.display = "block";
        } else if (this.value === "litro") {
            camposLitro.style.display = "block";
        } else if (this.value === "quilo") {
            camposQuilo.style.display = "block";
        } else if (this.value === "area") {
            camposArea.style.display = "block";
        }
    });
});

/* Função para calcular o custo unitário com base nas fórmulas */
function calcularCustoUnitario(tipo, valorTotal, comprimentoCm, volumeMl, pesoG, larguraCm, alturaCm) {
    let custoUnitario = 0;
    switch (tipo) {
        case "comprimento":
            custoUnitario = valorTotal / (comprimentoCm / 100);  // Divide por 100 para converter cm para m
            break;
        case "litro":
            custoUnitario = valorTotal / (volumeMl / 1000); // Divide por 1000 para converter ml para L
            break;
        case "quilo":
            custoUnitario = valorTotal / (pesoG / 1000);  // Divide por 1000 para converter g para kg
            break;
        case "unidade":
            custoUnitario = valorTotal;
            break;
        case "area":
            // A área já é calculada em m² em cadastrarMaterialInsumo
            custoUnitario = valorTotal / ((larguraCm/100) * (alturaCm/100)); // Divide o valor total pela área em m²
            break;
    }
    return custoUnitario;
}

/* Cadastrar Material/Insumo */
function cadastrarMaterialInsumo() {
    const nome = document.getElementById('nome-material').value.trim();
    const valorTotal = parseFloat(document.getElementById('valor-total-material').value);
    const tipo = document.querySelector('input[name="tipo-material"]:checked').value;
    let comprimentoCm = 0, volumeMl = 0, pesoG = 0, larguraCm = 0, alturaCm = 0;

    // --- Validação de entrada (mantido) ---
    if (!nome) {
        alert("Por favor, insira um nome para o material.");
        return;
    }
    if (isNaN(valorTotal) || valorTotal <= 0) {
        alert("Por favor, insira um valor total válido (maior que zero).");
        return;
    }

    // --- Coleta e validação de dimensões (mantido) ---
    if (tipo === 'comprimento') {
        comprimentoCm = parseFloat(document.getElementById('comprimento-cm').value);
        if (isNaN(comprimentoCm) || comprimentoCm <= 0) {
            alert("Por favor, insira um comprimento válido (maior que zero).");
            return;
        }
    } else if (tipo === 'litro') {
        volumeMl = parseFloat(document.getElementById('volume-ml').value);
        if (isNaN(volumeMl) || volumeMl <= 0) {
            alert("Por favor, insira um volume válido (maior que zero).");
            return;
        }
    } else if (tipo === 'quilo') {
        pesoG = parseFloat(document.getElementById('peso-g').value);
        if (isNaN(pesoG) || pesoG <= 0) {
            alert("Por favor, insira um peso válido (maior que zero).");
            return;
        }
    } else if (tipo === 'area') {
        larguraCm = parseFloat(document.getElementById('largura-cm').value);
        alturaCm = parseFloat(document.getElementById('altura-cm').value);
        if (isNaN(larguraCm) || larguraCm <= 0 || isNaN(alturaCm) || alturaCm <= 0) {
            alert("Por favor, insira dimensões válidas para a área (maiores que zero).");
            return;
        }
    }

    // --- Cálculo do Custo Unitário (mantido) ---
    const custoUnitario = calcularCustoUnitario(tipo, valorTotal, comprimentoCm, volumeMl, pesoG, larguraCm, alturaCm);

    // --- Criação do objeto do material (mantido) ---
    const item = {
        nome,
        tipo,
        custoUnitario,
        comprimentoCm,
        volumeMl,
        pesoG,
        larguraCm,
        alturaCm
    };

    // 1. Adiciona o item ao array de materiais.
    materiais.push(item);

    // 2. Atualiza a tabela *ANTES* de resetar o formulário.
    atualizarTabelaMateriaisInsumos();

    // 3. Salva os dados no Firebase (incluindo os materiais)
    salvarDadosFirebase();

    // 4. Limpa *todos* os campos do formulário.
    limparFormulario('form-materiais-insumos');

    // 5. Reseta o título do formulário.
    document.getElementById('titulo-materiais-insumos').textContent = "Cadastro de Materiais e Insumos";

    // 6. Seleciona o radio button "Comprimento" *e* dispara o evento 'change'.
    const radioComprimento = document.querySelector('input[name="tipo-material"][value="comprimento"]');
    radioComprimento.checked = true;
    radioComprimento.dispatchEvent(new Event('change')); // <-- Importante!

    // 7. Garante que o placeholder do comprimento esteja correto (cm).
    document.getElementById('comprimento-cm').placeholder = "Comprimento (cm)";

}

/* Atualizar a tabela de Materiais e Insumos */
function atualizarTabelaMateriaisInsumos() {
    const tbody = document.querySelector('#tabela-materiais-insumos tbody');
    tbody.innerHTML = '';
    materiais.forEach((item, index) => {
        const row = tbody.insertRow();
        const cellNome = row.insertCell();
        const cellTipo = row.insertCell();
        const cellCustoUnit = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNome.textContent = item.nome;
        cellTipo.textContent =
            (item.tipo === 'comprimento' ? 'Comprimento (Metro)' :
                item.tipo === 'litro' ? 'Litro' :
                    item.tipo === 'quilo' ? 'Quilo' :
                        item.tipo === 'area' ? 'Área (m²)' : 'Unidade');
        cellCustoUnit.textContent = formatarMoeda(item.custoUnitario);

        // Botão Editar
        const botaoEditar = document.createElement('button');
        botaoEditar.textContent = 'Editar';
        botaoEditar.addEventListener('click', function() {
            editarMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoEditar);

        // Botão Remover
        const botaoRemover = document.createElement('button');
        botaoRemover.textContent = 'Remover';
        botaoRemover.addEventListener('click', function() {
            removerMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoRemover);
    });
}

// Função para buscar materiais cadastrados
function buscarMateriaisCadastrados() {
    const termoBusca = document.getElementById('busca-material').value.toLowerCase();
    const tbody = document.querySelector('#tabela-materiais-insumos tbody');
    tbody.innerHTML = '';

    const materiaisFiltrados = materiais.filter(item => item.nome.toLowerCase().includes(termoBusca));

    materiaisFiltrados.forEach((item, index) => {
        const row = tbody.insertRow();
        const cellNome = row.insertCell();
        const cellTipo = row.insertCell();
        const cellCustoUnit = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNome.textContent = item.nome;
        cellTipo.textContent = item.tipo;
        cellCustoUnit.textContent = formatarMoeda(item.custoUnitario);

        // Botão Editar
        const botaoEditar = document.createElement('button');
        botaoEditar.textContent = 'Editar';
        botaoEditar.addEventListener('click', function() {
            editarMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoEditar);

        // Botão Remover
        const botaoRemover = document.createElement('button');
        botaoRemover.textContent = 'Remover';
        botaoRemover.addEventListener('click', function() {
            removerMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoRemover);
    });
}

function editarMaterialInsumo(index) {
    const item = materiais[index];

    // --- Preenche os campos do formulário ---
    document.getElementById('nome-material').value = item.nome;
    document.getElementById('valor-total-material').value = item.tipo === 'area' ? item.custoUnitario * ((item.larguraCm/100) * (item.alturaCm/100)) : item.custoUnitario;  //Mantem o valor total.

    // Seleciona o radio button correto *e* dispara o evento 'change'
    const radio = document.querySelector(`input[name="tipo-material"][value="${item.tipo}"]`);
    radio.checked = true;
    radio.dispatchEvent(new Event('change')); //  <-- Importante!

    // Preenche os campos de dimensão (se existirem)
    if (item.tipo === 'comprimento') {
        document.getElementById('comprimento-cm').value = item.comprimentoCm;
    } else if (item.tipo === 'litro') {
        document.getElementById('volume-ml').value = item.volumeMl;
    } else if (item.tipo === 'quilo') {
        document.getElementById('peso-g').value = item.pesoG;
    } else if (item.tipo === 'area') {
        document.getElementById('largura-cm').value = item.larguraCm;
        document.getElementById('altura-cm').value = item.alturaCm;
    }

    // --- Remove o item original (vai ser readicionado no final do cadastro) ---
    materiais.splice(index, 1);
    atualizarTabelaMateriaisInsumos();

    // --- Scroll e foco ---
    document.getElementById('materiais-insumos').scrollIntoView({ behavior: 'smooth' });
     document.getElementById('titulo-materiais-insumos').textContent = 'Editar Material/Insumo';
}

function removerMaterialInsumo(index) {
    materiais.splice(index, 1);
    atualizarTabelaMateriaisInsumos();
    salvarDadosFirebase(); // Salva no Firebase após remover material
}

// --- Mão de Obra ---
function calcularValorHora() {
    const salario = parseFloat(document.getElementById('salario-receber').value);
    const horas = parseInt(document.getElementById('horas-trabalhadas').value);

    if (isNaN(salario) || isNaN(horas) || horas === 0) {
      document.getElementById('valor-hora').value = '';
      return;
    }

    const valorHora = salario / horas;
    document.getElementById('valor-hora').value = valorHora.toFixed(2);
    return valorHora;
}

function calcularCustoFerias13o() {
    const salario = parseFloat(document.getElementById('salario-receber').value);
    const horas = parseInt(document.getElementById('horas-trabalhadas').value);
    const incluir = document.getElementById('incluir-ferias-13o-sim').checked;

    let custoFerias13o = 0;
    if (incluir) {
        custoFerias13o = ((salario + (salario / 3)) / 12) / horas;
    }
    document.getElementById('custo-ferias-13o').value = custoFerias13o.toFixed(2);
     return custoFerias13o;
}

function salvarMaoDeObra() {
    const valorHora = calcularValorHora();

    if (valorHora === undefined) {
        alert('Preencha os campos de salário e horas corretamente.');
        return;
    }

    maoDeObra.salario = parseFloat(document.getElementById('salario-receber').value);
    maoDeObra.horas = parseInt(document.getElementById('horas-trabalhadas').value);
    maoDeObra.valorHora = valorHora;
    maoDeObra.incluirFerias13o = document.getElementById('incluir-ferias-13o-sim').checked;
    maoDeObra.custoFerias13o = calcularCustoFerias13o();

    document.getElementById('salario-receber').value = maoDeObra.salario;
    document.getElementById('horas-trabalhadas').value = maoDeObra.horas;
    document.getElementById('valor-hora').value = maoDeObra.valorHora.toFixed(2);
    document.getElementById('custo-ferias-13o').value = maoDeObra.custoFerias13o.toFixed(2);

    alert("Dados de mão de obra salvos com sucesso!");
    salvarDadosFirebase();// Salva no Firebase após salvar mão de obra

    modoEdicaoMaoDeObra = true;
    document.getElementById('btn-salvar-mao-de-obra').style.display = 'none';
    document.getElementById('btn-editar-mao-de-obra').style.display = 'inline-block';

    document.getElementById('titulo-mao-de-obra').textContent = 'Informações sobre custo de mão de obra';
    document.getElementById('salario-receber').readOnly = true;
    document.getElementById('horas-trabalhadas').readOnly = true;

     atualizarTabelaCustosIndiretos(); // <---  Atualiza após salvar
     calcularCustos(); // Importante para atualizar a seção de cálculo
}

function editarMaoDeObra() {
    modoEdicaoMaoDeObra = false;

    document.getElementById('salario-receber').readOnly = false;
    document.getElementById('horas-trabalhadas').readOnly = false;

    document.getElementById('btn-editar-mao-de-obra').style.display = 'none';
    document.getElementById('btn-salvar-mao-de-obra').style.display = 'inline-block';

    document.getElementById('mao-de-obra').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('titulo-mao-de-obra').textContent = 'Informações sobre custo de mão de obra';
}

document.getElementById('salario-receber').addEventListener('input', function(){
    calcularValorHora();
    calcularCustoFerias13o();
});
document.getElementById('horas-trabalhadas').addEventListener('input', function(){
    calcularValorHora();
    calcularCustoFerias13o();
    atualizarTabelaCustosIndiretos(); // <--- Atualiza a tabela aqui!
    calcularCustos();  // <-- Importantíssimo! Recalcula após mudar horas
});

// --- Custos Indiretos ---

function carregarCustosIndiretosPredefinidos() {
    const listaCustos = document.getElementById('lista-custos-indiretos');
    listaCustos.innerHTML = '';

    custosIndiretosPredefinidosBase.forEach((custoBase, index) => {
        const listItem = document.createElement('li');
        // Encontra o custo correspondente ou usa o custo base
        const custoAtual = custosIndiretosPredefinidos.find(c => c.descricao === custoBase.descricao) || { ...custoBase };
        listItem.innerHTML = `
            <div class="custo-item-nome">${custoBase.descricao}</div>
            <input type="number" id="custo-indireto-${index}" value="${custoAtual.valorMensal.toFixed(2)}" step="0.01">
            <button onclick="salvarCustoIndiretoPredefinido(${index})">Salvar</button>
        `;
        listaCustos.appendChild(listItem);
    });

    // Custos Adicionais
    custosIndiretosAdicionais.forEach((custo) => {
        const listItem = document.createElement('li');
        listItem.dataset.index = custo.tempIndex; // Importante para identificar na remoção
        listItem.innerHTML = `
            <div class="custo-item-nome">${custo.descricao}</div>
            <input type="number" value="${custo.valorMensal.toFixed(2)}" step="0.01">
            <button onclick="salvarNovoCustoIndiretoLista(this)" data-index="${custo.tempIndex}">Salvar</button>
            <button onclick="removerNovoCustoIndiretoLista(this)" data-index="${custo.tempIndex}">Remover</button>
        `;
        listaCustos.appendChild(listItem);
    });

    atualizarTabelaCustosIndiretos();
}

function salvarCustoIndiretoPredefinido(index) {
    const inputValor = document.getElementById(`custo-indireto-${index}`);
    const novoValor = parseFloat(inputValor.value);
    const descricao = custosIndiretosPredefinidosBase[index].descricao;  //Pega a descrição da base

    if (!isNaN(novoValor)) {
        // Atualiza o custo predefinido, usando a descrição para encontrar o objeto correto
        const custoParaAtualizar = custosIndiretosPredefinidos.find(c => c.descricao === descricao);
        if(custoParaAtualizar){
            custoParaAtualizar.valorMensal = novoValor;
        }
        atualizarTabelaCustosIndiretos();
        calcularCustos(); // <-- Importante! Recalcula após salvar custo indireto
        salvarDadosFirebase();// Salva no Firebase após salvar custo indireto predefinido
    } else {
        alert("Por favor, insira um valor numérico válido.");
    }
}

function adicionarNovoCustoIndireto() {
    const listaCustos = document.getElementById('lista-custos-indiretos');
    const novoIndex = `novoCusto-${novoCustoIndiretoCounter++}`; // ID único

    const listItem = document.createElement('li');
    listItem.dataset.index = novoIndex;  // Armazena o ID
    listItem.innerHTML = `
        <input type="text" class="custo-item-nome" placeholder="Descrição do novo custo">
        <input type="number" value="0.00" step="0.01">
        <button onclick="salvarNovoCustoIndiretoLista(this)" data-index="${novoIndex}">Salvar</button>
        <button onclick="removerNovoCustoIndiretoLista(this)" data-index="${novoIndex}">Remover</button>
    `;
    listaCustos.appendChild(listItem);
}

function salvarNovoCustoIndiretoLista(botao) {
    const listItem = botao.parentNode;
    const descricaoInput = listItem.querySelector('.custo-item-nome');
    const valorInput = listItem.querySelector('input[type="number"]');
    const index = botao.dataset.index; // Recupera o ID

    const descricao = descricaoInput.value.trim();
    const valorMensal = parseFloat(valorInput.value);

    if (descricao && !isNaN(valorMensal)) {
        // Procura se o custo já existe
        const custoExistenteIndex = custosIndiretosAdicionais.findIndex(c => c.tempIndex === index);

        if (custoExistenteIndex !== -1) {
            // Atualiza o custo existente
            custosIndiretosAdicionais[custoExistenteIndex] = { descricao: descricao, valorMensal: valorMensal, tempIndex: index };
        } else {
            // Adiciona o novo custo
            custosIndiretosAdicionais.push({ descricao: descricao, valorMensal: valorMensal, tempIndex: index };
        }
        atualizarTabelaCustosIndiretos(); // Atualiza a tabela
        calcularCustos();  // <-- Importante!
        salvarDadosFirebase();// Salva no Firebase após salvar novo custo indireto

    } else {
        alert("Por favor, preencha a descrição e insira um valor numérico válido.");
    }
}

function removerNovoCustoIndiretoLista(botaoRemover) {
    const listItem = botaoRemover.parentNode;
    const indexToRemove = botaoRemover.dataset.index; // Recupera o ID

    // Filtra o array, removendo o item com o ID correto
    custosIndiretosAdicionais = custosIndiretosAdicionais.filter(custo => custo.tempIndex !== indexToRemove);
    listItem.remove();
    atualizarTabelaCustosIndiretos();
    calcularCustos(); // <-- Importante!
    salvarDadosFirebase();// Salva no Firebase após remover novo custo indireto
}

function atualizarTabelaCustosIndiretos() {
    const tbody = document.querySelector('#tabela-custos-indiretos tbody');
    tbody.innerHTML = '';
    const horasTrabalhadas = maoDeObra.horas;

    if (horasTrabalhadas === undefined || horasTrabalhadas === null || horasTrabalhadas <= 0) {
        const row = tbody.insertRow();
        const cellMensagem = row.insertCell();
        cellMensagem.textContent = "Preencha as 'Horas trabalhadas por mês' no menu 'Custo de Mão de Obra' para calcular o custo por hora.";
        cellMensagem.colSpan = 4;
        return;
    }

    const custosExibicao = [...custosIndiretosPredefinidos, ...custosIndiretosAdicionais].filter(custo => custo.valorMensal > 0);
    const custosFiltrados = custosExibicao.filter(custo => custo.descricao.toLowerCase().includes(termoBusca));

   custosFiltrados.forEach((custo) => {
        const originalIndexPredefinidos = custosIndiretosPredefinidos.findIndex(c => c.descricao === custo.descricao);
        const originalAdicional = custosIndiretosAdicionais.find(c => c.descricao === custo.descricao && c.tempIndex === custo.tempIndex);


        if (custo.valorMensal > 0 || originalAdicional) {
            const row = tbody.insertRow();
            const cellDescricao = row.insertCell();
            const cellValorMensal = row.insertCell();
            const cellValorHoraTrabalhada = row.insertCell();
            const cellAcoes = row.insertCell();

            cellDescricao.textContent = custo.descricao;
            cellValorMensal.textContent = formatarMoeda(custo.valorMensal);

            const valorPorHora = custo.valorMensal / horasTrabalhadas;
            cellValorHoraTrabalhada.textContent = formatarMoeda(valorPorHora);

            // Usa o tipo e o índice/tempIndex corretos
            let botaoAcao;
            if (originalIndexPredefinidos !== -1) {
                botaoAcao = document.createElement('button');
                botaoAcao.textContent = 'Zerar';
                botaoAcao.onclick = function() { zerarCustoIndireto(originalIndexPredefinidos, 'predefinido'); };
            } else if (originalAdicional) {
                botaoAcao = document.createElement('button');
                botaoAcao.textContent = 'Zerar'; // Usa "Zerar" em vez de "Remover"
                botaoAcao.onclick = function() { zerarCustoIndireto(custo.tempIndex, 'adicional'); };
            }

            cellAcoes.appendChild(botaoAcao);

        }
    });
}

// --- Produtos Cadastrados ---
function cadastrarProduto() {
    const nomeProduto = document.getElementById('nome-produto').value;
    const tabelaMateriaisProduto = document.getElementById('tabela-materiais-produto').querySelector('tbody');
    const linhasMateriais = tabelaMateriaisProduto.rows;

    if (!nomeProduto || linhasMateriais.length === 0) {
        alert("Por favor, preencha o nome do produto e adicione pelo menos um material.");
        return;
    }

    let materiaisDoProduto = [];
    let custoTotalMateriaisProduto = 0;

    for (let i = 0; i < linhasMateriais.length; i++) {
        const linha = linhasMateriais[i];
        const nomeMaterial = linha.cells[0].textContent;
        const tipoMaterial = linha.cells[1].textContent.split(' ')[0]; // Pega só a primeira parte (tipo)
        const custoUnitarioMaterial = parseFloat(linha.cells[2].textContent.replace(/[^\d.,-]/g, '').replace('.', '').replace(',', '.'));

        // --- DIMENSOES (agora em sua própria célula) ---
        const larguraInput = linha.cells[3].querySelector('.dimensoes-input.largura');
        const alturaInput = linha.cells[3].querySelector('.dimensoes-input.altura');
        const comprimentoInput = linha.cells[3].querySelector('.dimensoes-input.comprimento'); //Se for comprimento

        const largura = larguraInput ? parseFloat(larguraInput.value) : 0;
        const altura = alturaInput ? parseFloat(alturaInput.value) : 0;
        const comprimento = comprimentoInput? parseFloat(comprimentoInput.value) : 0;


        // --- QUANTIDADE (agora separada das dimensões) ---
        const inputQuantidade = linha.cells[4].querySelector('.quantidade-input');  // Célula 4
        let quantidadeMaterial = quantidadeInput ? parseFloat(quantidadeInput.value) : 0;


        // --- CÁLCULO DO CUSTO TOTAL (CORREÇÃO AQUI) ---
        let custoTotalMaterial = 0;
        if (tipoMaterial === 'Área') {
            const area = (largura * altura) / 10000; // Calcula a área em m²
            custoTotalMaterial = custoUnitarioMaterial * area;
        } else if (tipoMaterial === 'Comprimento') {
            // CONVERTE comprimento de cm para m ANTES de calcular o custo
            const comprimentoEmMetros = comprimento / 100;
            custoTotalMaterial = custoUnitarioMaterial * comprimentoEmMetros; // Usa o comprimento em METROS
        } else {
          custoTotalMaterial = custoUnitarioMaterial * quantidadeMaterial;
        }


        materiaisDoProduto.push({
            nome: nomeMaterial,
            tipo: tipoMaterial,
            custoUnitario: custoUnitarioMaterial,
            largura: largura,      // Valor da largura
            altura: altura,       // Valor da altura
            comprimento: comprimento, //Comprimento *em cm* (para consistência e edição)
            quantidade: quantidadeMaterial, // Valor da QUANTIDADE (separado)
            custoTotal: custoTotalMaterial
        });
        custoTotalMateriaisProduto += custoTotalMaterial;
    }

    const produto = {
        nome: nomeProduto,
        materiais: materiaisDoProduto,
        custoMateriais: custoTotalMateriaisProduto
    };
    produtos.push(produto);

    atualizarTabelaProdutosCadastrados();
    limparFormulario('form-produtos-cadastrados');
    tabelaMateriaisProduto.innerHTML = '';
    salvarDadosFirebase();// Salva no Firebase após cadastrar produto
    alert('Produto cadastrado com sucesso!');
}

function atualizarTabelaProdutosCadastrados() {
    const tbody = document.querySelector('#tabela-produtos tbody');
    tbody.innerHTML = '';

    produtos.forEach((produto, index) => {
        const row = tbody.insertRow();
        const cellNomeProduto = row.insertCell();
        const cellMateriaisUtilizados = row.insertCell();
        const cellCustoTotalMateriais = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNomeProduto.textContent = produto.nome;

        let listaMateriaisHTML = '<ul>';
        produto.materiais.forEach(material => {
            let dimensoesTexto = '';
            if (material.tipo === 'Área') {
                dimensoesTexto = `(${material.largura.toFixed(2)}cm x ${material.altura.toFixed(2)}cm)`;
            } else if (material.tipo === 'Comprimento') {
                dimensoesTexto = `(${material.comprimento.toFixed(2)}cm)`;
            }
            listaMateriaisHTML += `<li>${material.nome} ${dimensoesTexto} - ${formatarMoeda(material.custoTotal)} (Qtd: ${material.quantidade.toFixed(2)})</li>`;
        });
        listaMateriaisHTML += '</ul>';
        cellMateriaisUtilizados.innerHTML = listaMateriaisHTML;
        cellCustoTotalMateriais.textContent = formatarMoeda(produto.custoMateriais);

        const botaoEditarProduto = document.createElement('button');
        botaoEditarProduto.textContent = 'Editar';
        botaoEditarProduto.addEventListener('click', function() {
            editarProduto(index);
        });
        cellAcoes.appendChild(botaoEditarProduto);

        const botaoRemoverProduto = document.createElement('button');
        botaoRemoverProduto.textContent = 'Remover';
        botaoRemoverProduto.addEventListener('click', function() {
            removerProduto(index);
        });
        cellAcoes.appendChild(botaoRemoverProduto);
    });
}

function buscarProdutosCadastrados() {
    const termoBusca = document.getElementById('busca-produto').value.toLowerCase();
    const tbody = document.querySelector('#tabela-produtos tbody');
    tbody.innerHTML = '';

    const produtosFiltrados = produtos.filter(produto => produto.nome.toLowerCase().includes(termoBusca));

    produtosFiltrados.forEach((produto, index) => {
		const row = tbody.insertRow();
        const cellNomeProduto = row.insertCell();
        const cellMateriaisUtilizados = row.insertCell();
        const cellCustoTotalMateriais = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNomeProduto.textContent = produto.nome;

        let listaMateriaisHTML = '<ul>';
        produto.materiais.forEach(material => {
			//Modificação para exibir largura e altura.
            let dimensoesTexto = '';
            if (material.tipo === 'Área') {
                dimensoesTexto = `(${material.largura.toFixed(2)}cm x ${material.altura.toFixed(2)}cm)`;
            }else if (material.tipo === 'Comprimento') {
                dimensoesTexto = `(${material.comprimento.toFixed(2)}cm)`; //Mostra o comprimento
            }
            listaMateriaisHTML += `<li>${material.nome} ${dimensoesTexto} - ${formatarMoeda(material.custoTotal)} (Qtd: ${material.quantidade.toFixed(2)})</li>`;
        });
        listaMateriaisHTML += '</ul>';
        cellMateriaisUtilizados.innerHTML = listaMateriaisHTML;
        cellCustoTotalMateriais.textContent = formatarMoeda(produto.custoMateriais);

        const botaoEditarProduto = document.createElement('button');
        botaoEditarProduto.textContent = 'Editar';
        botaoEditarProduto.addEventListener('click', function() {
            editarProduto(index);
        });
        cellAcoes.appendChild(botaoEditarProduto);

        const botaoRemoverProduto = document.createElement('button');
        botaoRemoverProduto.textContent = 'Remover';
        botaoRemoverProduto.addEventListener('click', function() {
            removerProduto(index);
        });
        cellAcoes.appendChild(botaoRemoverProduto);
    });
}

function adicionarMaterialNaTabelaProduto(material) {
    const tbody = document.querySelector('#tabela-materiais-produto tbody');
    const row = tbody.insertRow();
    const cellNome = row.insertCell();
    const cellTipo = row.insertCell();
    const cellCustoUnitario = row.insertCell();
    const cellDimensoes = row.insertCell();
    const cellQuantidade = row.insertCell();
    const cellCustoTotal = row.insertCell();
    const cellAcoes = row.insertCell();

    cellNome.textContent = material.nome;
    let unidade = '';
    switch (material.tipo) {
        case 'comprimento': unidade = ' (m)'; break;
        case 'litro': unidade = ' (L)'; break;
        case 'quilo': unidade = ' (kg)'; break;
        case 'unidade': unidade = ' (un)'; break;
        case 'area': unidade = ' (m²)'; break;
    }
    cellTipo.textContent = material.tipo.charAt(0).toUpperCase() + material.tipo.slice(1) + unidade;
    cellCustoUnitario.textContent = formatarMoeda(material.custoUnitario);

    // --- Campos de Dimensões (Largura, Altura e Comprimento) ---
    // MODIFICAÇÃO AQUI: Adiciona a unidade de medida ao placeholder
    let larguraInput, alturaInput, comprimentoInput;

    if (material.tipo === 'area') {
        larguraInput = document.createElement('input');
        larguraInput.type = 'number';
        larguraInput.placeholder = 'Largura (cm)'; // Adiciona (cm)
        larguraInput.min = 0.01;
        larguraInput.step = 0.01;
        larguraInput.classList.add('dimensoes-input', 'largura');
        larguraInput.value = material.largura || '';

        alturaInput = document.createElement('input');
        alturaInput.type = 'number';
        alturaInput.placeholder = 'Altura (cm)'; // Adiciona (cm)
        alturaInput.min = 0.01;
        alturaInput.step = 0.01;
        alturaInput.classList.add('dimensoes-input', 'altura');
        alturaInput.value = material.altura || '';

        cellDimensoes.appendChild(larguraInput);
        cellDimensoes.appendChild(alturaInput);

    } else if (material.tipo === 'comprimento') {
        comprimentoInput = document.createElement('input');
        comprimentoInput.type = 'number';
        comprimentoInput.placeholder = 'Comprimento (cm)'; // Adiciona (cm)
        comprimentoInput.min = 0.01;
        comprimentoInput.step = 0.01;
        comprimentoInput.classList.add('dimensoes-input', 'comprimento');
        comprimentoInput.value = material.comprimento || '';
        cellDimensoes.appendChild(comprimentoInput);
    }
    // --- Campo de Quantidade (AGORA SEPARADO) ---
    const inputQuantidade = document.createElement('input');
    inputQuantidade.type = 'number';
    inputQuantidade.value = material.quantidade || 1;
    inputQuantidade.min = 0.01;
    inputQuantidade.step = 0.01;
    inputQuantidade.classList.add('quantidade-input');
    inputQuantidade.readOnly = material.tipo === 'area';


    const unidadeMedidaSpan = document.createElement('span');
    unidadeMedidaSpan.classList.add('unidade-medida');
    // --- Lógica para Área (agora calcula e exibe a área corretamente) ---
    if (material.tipo === 'area') {
        const areaSpan = document.createElement('span');
        areaSpan.classList.add('dimensoes-span');
        cellDimensoes.appendChild(areaSpan);
        unidadeMedidaSpan.textContent = '';

        // Função para calcular a área e atualizar o custo total
        function calcularAreaEAtualizar() {
            const largura = parseFloat(larguraInput.value) || 0;
            const altura = parseFloat(alturaInput.value) || 0;

            if (isNaN(largura) || largura <= 0 || isNaN(altura) || altura <= 0) {
                areaSpan.textContent = '0.00 m²';
                inputQuantidade.value = 0;
                calcularCustoTotalMaterial();
                return;
            }

            const area = (largura * altura) / 10000;
            areaSpan.textContent = area.toFixed(2) + ' m²';
            inputQuantidade.value = area.toFixed(2);
            calcularCustoTotalMaterial();
        }

        larguraInput.addEventListener('input', calcularAreaEAtualizar);
        alturaInput.addEventListener('input', calcularAreaEAtualizar);

        calcularAreaEAtualizar();

    } else if(material.tipo === 'comprimento'){
        const comprimentoSpan = document.createElement('span');
        comprimentoSpan.classList.add('dimensoes-span');
        cellDimensoes.appendChild(comprimentoSpan);
        unidadeMedidaSpan.textContent = '';

        function calcularComprimentoEAtualizar(){
            const comprimento = parseFloat(comprimentoInput.value) || 0;

            if(isNaN(comprimento) || comprimento <= 0){
                comprimentoSpan.textContent = '0.00 cm';
                inputQuantidade.value = 0;
                calcularCustoTotalMaterial();
                return;
            }

            comprimentoSpan.textContent = comprimento.toFixed(2) + ' cm';
            inputQuantidade.value = comprimento.toFixed(2);
            calcularCustoTotalMaterial();
        }
        comprimentoInput.addEventListener('input', calcularComprimentoEAtualizar);
        calcularComprimentoEAtualizar();

    }else {
        unidadeMedidaSpan.textContent = unidade;
        inputQuantidade.addEventListener('input', calcularCustoTotalMaterial);
    }

    cellQuantidade.appendChild(inputQuantidade);
    cellQuantidade.appendChild(unidadeMedidaSpan);


    // --- Função para calcular o custo total ---
    function calcularCustoTotalMaterial() {
        let quantidade = parseFloat(inputQuantidade.value);
         if (isNaN(quantidade) || quantidade <= 0) {
            if(material.tipo !== 'area' && material.tipo !== 'comprimento'){
                quantidade = 0.01;
                inputQuantidade.value = quantidade;
            } else{
                quantidade = 0;
            }
        }

        let custoTotal = 0;
        if(material.tipo === "area"){
            const largura = parseFloat(larguraInput.value) || 0;
            const altura = parseFloat(alturaInput.value) || 0;
            const area = (largura * altura) / 10000;
            custoTotal = material.custoUnitario * area;

        } else if(material.tipo === "comprimento") {
            const comprimento = parseFloat(comprimentoInput.value) || 0;
            const comprimentoEmMetros = comprimento / 100;
            custoTotal = material.custoUnitario * comprimentoEmMetros;

        } else {
          custoTotal = material.custoUnitario * quantidade;
        }

        cellCustoTotal.textContent = formatarMoeda(custoTotal);
    }

    calcularCustoTotalMaterial();


    const botaoRemoverMaterial = document.createElement('button');
    botaoRemoverMaterial.textContent = 'Remover';
    botaoRemoverMaterial.addEventListener('click', function() {
        removerLinhaMaterial(row);
    });
    cellAcoes.appendChild(botaoRemoverMaterial);
}

function editarProduto(index) {
    const produto = produtos[index];
    if (!produto) return;

    document.getElementById('nome-produto').value = produto.nome;

    const tabelaMateriaisProdutoBody = document.querySelector('#tabela-materiais-produto tbody');
    tabelaMateriaisProdutoBody.innerHTML = '';

    produto.materiais.forEach(material => {
        adicionarMaterialNaTabelaProduto(material);
    });

    produtos.splice(index, 1);
    atualizarTabelaProdutosCadastrados();
    salvarDadosFirebase();// Salva no Firebase após editar produto
    document.getElementById('produtos-cadastrados').scrollIntoView({ behavior: 'smooth' });
    document.querySelector('#produtos-cadastrados h2').textContent = 'Editar Produto';
}

function removerProduto(index) {
    produtos.splice(index, 1);
    atualizarTabelaProdutosCadastrados();
    salvarDadosFirebase();// Salva no Firebase após remover produto
}

// --- Pesquisa e Adição de Materiais na Seção Produtos ---
document.getElementById('pesquisa-material').addEventListener('input', function() {
    const termoPesquisa = this.value.toLowerCase();
    const resultadosPesquisaDiv = document.getElementById('resultados-pesquisa');
    resultadosPesquisaDiv.innerHTML = '';

    if (termoPesquisa.length < 2) {
        resultadosPesquisaDiv.style.display = 'none';
        return;
    }

    const materiaisFiltrados = materiais.filter(material => material.nome.toLowerCase().includes(termoPesquisa));

    if (materiaisFiltrados.length > 0) {
        resultadosPesquisaDiv.style.display = 'block';
        materiaisFiltrados.forEach(material => {
            const resultadoDiv = document.createElement('div');
            resultadoDiv.textContent = material.nome + ' (' + material.tipo + ') - Custo Unitário: ' + formatarMoeda(material.custoUnitario);
            resultadoDiv.addEventListener('click', function() {
                adicionarMaterialNaTabelaProduto(material);
                document.getElementById('pesquisa-material').value = '';
                resultadosPesquisaDiv.innerHTML = '';
                resultadosPesquisaDiv.style.display = 'none';
                salvarDadosFirebase();// Salva no Firebase após adicionar material na tabela de produtos
            });
            resultadosPesquisaDiv.appendChild(resultadoDiv);
        });
    } else {
        resultadosPesquisaDiv.style.display = 'none';
    }
});

function removerLinhaMaterial(row) {
    row.remove();
     salvarDadosFirebase();// Salva no Firebase após remover linha de material
}

// --- Cálculo da Precificação (Refatorado) ---

function buscarProdutosAutocomplete() {
    const termo = document.getElementById('produto-pesquisa').value.toLowerCase();
    const resultadosDiv = document.getElementById('produto-resultados');
    resultadosDiv.innerHTML = ''; // Limpa resultados anteriores
    resultadosDiv.classList.remove('hidden'); //Mostra a div

    if (termo.length < 2) {
        resultadosDiv.classList.add('hidden'); //Esconde se termo muito curto.
        return; // Sai se o termo for muito curto
    }

    const produtosFiltrados = produtos.filter(produto => produto.nome.toLowerCase().includes(termo));

    if (produtosFiltrados.length > 0) {
        produtosFiltrados.forEach(produto => {
            const div = document.createElement('div');
            div.textContent = produto.nome;
            div.addEventListener('click', function() {
                selecionarProduto(produto.nome); // Função para selecionar
                resultadosDiv.classList.add('hidden'); // Esconde após seleção
            });
            resultadosDiv.appendChild(div);
        });
    } else {
       resultadosDiv.classList.add('hidden'); //Esconde caso não encontre.
    }
}

function selecionarProduto(nomeProduto) {
    document.getElementById('produto-pesquisa').value = nomeProduto; // Preenche o campo
    carregarDadosProduto(nomeProduto); // Carrega os dados (custo)
}

function carregarDadosProduto(nomeProduto) {
    const produto = produtos.find(p => p.nome === nomeProduto);

    if (produto) {
        document.getElementById('custo-produto').textContent = formatarMoeda(produto.custoMateriais);
        // Exibe os detalhes do produto (materiais)
        const detalhesProdutoDiv = document.getElementById('detalhes-produto');
        const listaMateriais = document.getElementById('lista-materiais-produto');
        listaMateriais.innerHTML = ''; // Limpa a lista

        produto.materiais.forEach(material => {
            //Modificação para exibir largura e altura
			let dimensoesTexto = '';
            if (material.tipo === 'Área') {
                dimensoesTexto = `(${material.largura.toFixed(2)}cm x ${material.altura.toFixed(2)}cm)`;
            }else if (material.tipo === 'Comprimento') {
                dimensoesTexto = `(${material.comprimento.toFixed(2)}cm)`; //Mostra o comprimento
            }
            const li = document.createElement('li');
            li.textContent = `${material.nome} ${dimensoesTexto} (${material.tipo}) - Qtd: ${material.quantidade.toFixed(2)} - Custo: ${formatarMoeda(material.custoTotal)}`;  //Quantidade com 2 casas
            listaMateriais.appendChild(li);
        });
        detalhesProdutoDiv.style.display = 'block'; // Mostra a div

        calcularCustos(); // Recalcula *tudo*
    } else {
        document.getElementById('custo-produto').textContent = 'R$ 0,00';
         document.getElementById('detalhes-produto').style.display = 'none'; // Esconde se não tiver produto
    }
}

function calcularCustos() {
    const horasProduto = parseFloat(document.getElementById('horas-produto').value) || 0;

    // 1. Custo de Mão de Obra (DETALHADO)
    const custoMaoDeObra = maoDeObra.valorHora * horasProduto;
    const custoFerias13o = maoDeObra.custoFerias13o * horasProduto;
    const totalMaoDeObra = custoMaoDeObra + custoFerias13o;

    document.getElementById('custo-mao-de-obra-detalhe').textContent = formatarMoeda(custoMaoDeObra);
    document.getElementById('custo-ferias-13o-detalhe').textContent = formatarMoeda(custoFerias13o);
    document.getElementById('total-mao-de-obra').textContent = formatarMoeda(totalMaoDeObra);


    // 2. Custo do Produto (já é carregado em carregarDadosProduto)

    // 3. Custos Indiretos (DETALHADO, por item, e SÓ SE > 0)
    let custoIndiretoTotalProduto = 0;
    const listaCustosIndiretosDetalhes = document.getElementById('lista-custos-indiretos-detalhes');
    listaCustosIndiretosDetalhes.innerHTML = ''; // Limpa a lista

    custosIndiretosPredefinidos.forEach(custo => {
        const custoPorHora = custo.valorMensal / maoDeObra.horas;
        const custoItemProduto = custoPorHora * horasProduto;

        // AQUI: Só adiciona à lista se o custo for > 0
        if (custoItemProduto > 0) {
            custoIndiretoTotalProduto += custoItemProduto;
            const li = document.createElement('li');
            li.textContent = `${custo.descricao}: ${formatarMoeda(custoItemProduto)}`;
            listaCustosIndiretosDetalhes.appendChild(li);
        }
    });

    custosIndiretosAdicionais.forEach(custo => {
        const custoPorHora = custo.valorMensal / maoDeObra.horas;
        const custoItemProduto = custoPorHora * horasProduto;

        // AQUI: Só adiciona à lista se o custo for > 0
        if (custoItemProduto > 0) {
            custoIndiretoTotalProduto += custoItemProduto;
            const li = document.createElement('li');
            li.textContent = `${custo.descricao}: ${formatarMoeda(custoItemProduto)}`;
            listaCustosIndiretosDetalhes.appendChild(li);
        }
    });

     document.getElementById('custo-indireto').textContent = formatarMoeda(custoIndiretoTotalProduto); // Total (por hora)

    // 4. Subtotal
    const nomeProduto = document.getElementById('produto-pesquisa').value;
    const produto = produtos.find(p => p.nome === nomeProduto);
    const custoProduto = produto ? produto.custoMateriais : 0;
    const subtotal = custoProduto + totalMaoDeObra + custoIndiretoTotalProduto;
    document.getElementById('subtotal').textContent = formatarMoeda(subtotal);

    calcularPrecoVendaFinal(); //Chama para já calcular com os novos valores.
}

function calcularPrecoVendaFinal(){
   const margemLucro = parseFloat(document.getElementById('margem-lucro-final').value) / 100 || 0;
    const subtotalTexto = document.getElementById('subtotal').textContent;

    // Converte o subtotal para um número, tratando a formatação de moeda
    const subtotalNumerico = parseFloat(subtotalTexto.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.')) || 0;
    const precoVenda = subtotalNumerico * (1 + margemLucro);
     const margemLucroValor = precoVenda - subtotalNumerico; //Calcula a margem
    document.getElementById('margem-lucro-valor').textContent = formatarMoeda(margemLucroValor);
    document.getElementById('total-final').textContent = formatarMoeda(precoVenda);

    calcularTotalComTaxas(); //Chama a função para o cálculo final.
}

// --- Função para Taxa de Crédito ---
function salvarTaxaCredito() {
    const incluir = document.getElementById('incluir-taxa-credito-sim').checked;
    const percentual = parseFloat(document.getElementById('taxa-credito-percentual').value);

    if (incluir && (isNaN(percentual) || percentual < 0)) {
        alert("Por favor, insira um valor percentual válido para a taxa.");
        return;
    }

    taxaCredito.incluir = incluir;
    taxaCredito.percentual = incluir ? percentual : 0; //Salva 0 se não incluir.
    calcularTotalComTaxas(); //Recalcula o total com a nova taxa.
    salvarDadosFirebase();// Salva no Firebase após salvar taxa de crédito
}

function calcularTotalComTaxas() {
    const precoVendaTexto = document.getElementById('total-final').textContent; //Pega do total com margem.
    const precoVendaNumerico = parseFloat(precoVendaTexto.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.')) || 0;

    let taxaCreditoValor = 0;
    if (taxaCredito.incluir) {
        taxaCreditoValor = precoVendaNumerico * (taxaCredito.percentual / 100);
    }
    document.getElementById('taxa-credito-valor').textContent = formatarMoeda(taxaCreditoValor);

    const totalFinalComTaxas = precoVendaNumerico + taxaCreditoValor;
    document.getElementById('total-final-com-taxas').textContent = formatarMoeda(totalFinalComTaxas);
}

// Event Listeners (ajustado)
document.addEventListener('DOMContentLoaded', () => {

    // Não precisa mais carregar produtos em um <select>

    // Evento para o autocomplete
    document.getElementById('produto-pesquisa').addEventListener('input', buscarProdutosAutocomplete);

    // Eventos para cálculo
    document.getElementById('horas-produto').addEventListener('input', calcularCustos);
     document.getElementById('margem-lucro-final').addEventListener('input', calcularPrecoVendaFinal);

     //Eventos para a taxa
     document.getElementById('incluir-taxa-credito-sim').addEventListener('change', salvarTaxaCredito);
      document.getElementById('incluir-taxa-credito-nao').addEventListener('change', salvarTaxaCredito);
     document.getElementById('taxa-credito-percentual').addEventListener('input', salvarTaxaCredito);
});

//Para esconder o autocomplete quando clica fora.
document.addEventListener('click', function(event) {
    const autocompleteDiv = document.getElementById('produto-resultados');
    const inputPesquisa = document.getElementById('produto-pesquisa');

    if (event.target !== autocompleteDiv && event.target !== inputPesquisa) {
        autocompleteDiv.classList.add('hidden');
    }
});
```

**`precificacao.js`:**

```javascript
/* Variáveis globais */
let materiais = [];
let maoDeObra = { salario: 0, horas: 220, valorHora: 0, incluirFerias13o: false, custoFerias13o: 0 }; // Horas padrão 220h
let custosIndiretosPredefinidosBase = [ // This is the base template, never modified
    { descricao: "Energia elétrica", valorMensal: 0 },
    { descricao: "Água", valorMensal: 0 },
    { descricao: "Gás", valorMensal: 0 },
    { descricao: "Aluguel do espaço", valorMensal: 0 },
    { descricao: "Depreciação de máquinas e equipamentos", valorMensal: 0 },
    { descricao: "Manutenção predial e de equipamentos", valorMensal: 0 },
    { descricao: "Despesas com segurança", valorMensal: 0 },
    { descricao: "Limpeza e conservação", valorMensal: 0 },
    { descricao: "Material de escritório", valorMensal: 0 },
    { descricao: "Impostos e taxas indiretos", valorMensal: 0 },
    { descricao: "Marketing institucional", valorMensal: 0 },
    { descricao: "Transporte e logística", valorMensal: 0 },
    { descricao: "Despesas com utilidades", valorMensal: 0 },
    { descricao: "Demais custos administrativos", valorMensal: 0 }
];
let custosIndiretosPredefinidos = JSON.parse(JSON.stringify(custosIndiretosPredefinidosBase)); // Working copy, modified by user inputs
let custosIndiretosAdicionais = [];
let produtos = [];
let modoEdicaoMaoDeObra = false;
let itemEdicaoCustoIndireto = null;
let novoCustoIndiretoCounter = 0; // Contador para IDs únicos de custos indiretos adicionais
let taxaCredito = {percentual: 6, incluir: false}; //Objeto para taxa de crédito


/* Formatação de valores em moeda */
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* Exibir a subpágina desejada */
function mostrarSubMenu(submenuId) {
    const conteudos = ['materiais-insumos', 'mao-de-obra', 'custos-indiretos', 'produtos-cadastrados', 'calculo-precificacao'];
    conteudos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = 'none';
        }
    });
    const submenu = document.getElementById(submenuId);
    if (submenu) {
        submenu.style.display = 'block';
    }
}

/* Limpar formulário */
function limparFormulario(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

/* Monitorar os radios para exibir os campos corretos */
document.querySelectorAll('input[name="tipo-material"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const camposComprimento = document.getElementById('campos-comprimento');
        const camposLitro = document.getElementById('campos-litro');
        const camposQuilo = document.getElementById('campos-quilo');
        const camposArea = document.getElementById('campos-area');

        camposComprimento.style.display = 'none';
        camposLitro.style.display = 'none';
        camposQuilo.style.display = 'none';
        camposArea.style.display = 'none';

        if (this.value === "comprimento") {
            camposComprimento.style.display = "block";
        } else if (this.value === "litro") {
            camposLitro.style.display = "block";
        } else if (this.value === "quilo") {
            camposQuilo.style.display = "block";
        } else if (this.value === "area") {
            camposArea.style.display = "block";
        }
    });
});

/* Função para calcular o custo unitário com base nas fórmulas */
function calcularCustoUnitario(tipo, valorTotal, comprimentoCm, volumeMl, pesoG, larguraCm, alturaCm) {
    let custoUnitario = 0;
    switch (tipo) {
        case "comprimento":
            custoUnitario = valorTotal / (comprimentoCm / 100);  // Divide por 100 para converter cm para m
            break;
        case "litro":
            custoUnitario = valorTotal / (volumeMl / 1000); // Divide por 1000 para converter ml para L
            break;
        case "quilo":
            custoUnitario = valorTotal / (pesoG / 1000);  // Divide por 1000 para converter g para kg
            break;
        case "unidade":
            custoUnitario = valorTotal;
            break;
        case "area":
            // A área já é calculada em m² em cadastrarMaterialInsumo
            custoUnitario = valorTotal / ((larguraCm/100) * (alturaCm/100)); // Divide o valor total pela área em m²
            break;
    }
    return custoUnitario;
}

/* Cadastrar Material/Insumo */
function cadastrarMaterialInsumo() {
    const nome = document.getElementById('nome-material').value.trim();
    const valorTotal = parseFloat(document.getElementById('valor-total-material').value);
    const tipo = document.querySelector('input[name="tipo-material"]:checked').value;
    let comprimentoCm = 0, volumeMl = 0, pesoG = 0, larguraCm = 0, alturaCm = 0;

    // --- Validação de entrada (mantido) ---
    if (!nome) {
        alert("Por favor, insira um nome para o material.");
        return;
    }
    if (isNaN(valorTotal) || valorTotal <= 0) {
        alert("Por favor, insira um valor total válido (maior que zero).");
        return;
    }

    // --- Coleta e validação de dimensões (mantido) ---
    if (tipo === 'comprimento') {
        comprimentoCm = parseFloat(document.getElementById('comprimento-cm').value);
        if (isNaN(comprimentoCm) || comprimentoCm <= 0) {
            alert("Por favor, insira um comprimento válido (maior que zero).");
            return;
        }
    } else if (tipo === 'litro') {
        volumeMl = parseFloat(document.getElementById('volume-ml').value);
        if (isNaN(volumeMl) || volumeMl <= 0) {
            alert("Por favor, insira um volume válido (maior que zero).");
            return;
        }
    } else if (tipo === 'quilo') {
        pesoG = parseFloat(document.getElementById('peso-g').value);
        if (isNaN(pesoG) || pesoG <= 0) {
            alert("Por favor, insira um peso válido (maior que zero).");
            return;
        }
    } else if (tipo === 'area') {
        larguraCm = parseFloat(document.getElementById('largura-cm').value);
        alturaCm = parseFloat(document.getElementById('altura-cm').value);
        if (isNaN(larguraCm) || larguraCm <= 0 || isNaN(alturaCm) || alturaCm <= 0) {
            alert("Por favor, insira dimensões válidas para a área (maiores que zero).");
            return;
        }
    }

    // --- Cálculo do Custo Unitário (mantido) ---
    const custoUnitario = calcularCustoUnitario(tipo, valorTotal, comprimentoCm, volumeMl, pesoG, larguraCm, alturaCm);

    // --- Criação do objeto do material (mantido) ---
    const item = {
        nome,
        tipo,
        custoUnitario,
        comprimentoCm,
        volumeMl,
        pesoG,
        larguraCm,
        alturaCm
    };

    // 1. Adiciona o item ao array de materiais.
    materiais.push(item);

    // 2. Atualiza a tabela *ANTES* de resetar o formulário.
    atualizarTabelaMateriaisInsumos();

    // 3. Salva os dados no Firebase (incluindo os materiais)
    salvarDadosFirebase();

    // 4. Limpa *todos* os campos do formulário.
    limparFormulario('form-materiais-insumos');

    // 5. Reseta o título do formulário.
    document.getElementById('titulo-materiais-insumos').textContent = "Cadastro de Materiais e Insumos";

    // 6. Seleciona o radio button "Comprimento" *e* dispara o evento 'change'.
    const radioComprimento = document.querySelector('input[name="tipo-material"][value="comprimento"]');
    radioComprimento.checked = true;
    radioComprimento.dispatchEvent(new Event('change')); // <-- Importante!

    // 7. Garante que o placeholder do comprimento esteja correto (cm).
    document.getElementById('comprimento-cm').placeholder = "Comprimento (cm)";

}

/* Atualizar a tabela de Materiais e Insumos */
function atualizarTabelaMateriaisInsumos() {
    const tbody = document.querySelector('#tabela-materiais-insumos tbody');
    tbody.innerHTML = '';
    materiais.forEach((item, index) => {
        const row = tbody.insertRow();
        const cellNome = row.insertCell();
        const cellTipo = row.insertCell();
        const cellCustoUnit = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNome.textContent = item.nome;
        cellTipo.textContent =
            (item.tipo === 'comprimento' ? 'Comprimento (Metro)' :
                item.tipo === 'litro' ? 'Litro' :
                    item.tipo === 'quilo' ? 'Quilo' :
                        item.tipo === 'area' ? 'Área (m²)' : 'Unidade');
        cellCustoUnit.textContent = formatarMoeda(item.custoUnitario);

        // Botão Editar
        const botaoEditar = document.createElement('button');
        botaoEditar.textContent = 'Editar';
        botaoEditar.addEventListener('click', function() {
            editarMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoEditar);

        // Botão Remover
        const botaoRemover = document.createElement('button');
        botaoRemover.textContent = 'Remover';
        botaoRemover.addEventListener('click', function() {
            removerMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoRemover);
    });
}

// Função para buscar materiais cadastrados
function buscarMateriaisCadastrados() {
    const termoBusca = document.getElementById('busca-material').value.toLowerCase();
    const tbody = document.querySelector('#tabela-materiais-insumos tbody');
    tbody.innerHTML = '';

    const materiaisFiltrados = materiais.filter(item => item.nome.toLowerCase().includes(termoBusca));

    materiaisFiltrados.forEach((item, index) => {
        const row = tbody.insertRow();
        const cellNome = row.insertCell();
        const cellTipo = row.insertCell();
        const cellCustoUnit = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNome.textContent = item.nome;
        cellTipo.textContent = item.tipo;
        cellCustoUnit.textContent = formatarMoeda(item.custoUnitario);

        // Botão Editar
        const botaoEditar = document.createElement('button');
        botaoEditar.textContent = 'Editar';
        botaoEditar.addEventListener('click', function() {
            editarMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoEditar);

        // Botão Remover
        const botaoRemover = document.createElement('button');
        botaoRemover.textContent = 'Remover';
        botaoRemover.addEventListener('click', function() {
            removerMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoRemover);
    });
}

function editarMaterialInsumo(index) {
    const item = materiais[index];

    // --- Preenche os campos do formulário ---
    document.getElementById('nome-material').value = item.nome;
    document.getElementById('valor-total-material').value = item.tipo === 'area' ? item.custoUnitario * ((item.larguraCm/100) * (item.alturaCm/100)) : item.custoUnitario;  //Mantem o valor total.

    // Seleciona o radio button correto *e* dispara o evento 'change'
    const radio = document.querySelector(`input[name="tipo-material"][value="${item.tipo}"]`);
    radio.checked = true;
    radio.dispatchEvent(new Event('change')); //  <-- Importante!

    // Preenche os campos de dimensão (se existirem)
    if (item.tipo === 'comprimento') {
        document.getElementById('comprimento-cm').value = item.comprimentoCm;
    } else if (item.tipo === 'litro') {
        document.getElementById('volume-ml').value = item.volumeMl;
    } else if (item.tipo === 'quilo') {
        document.getElementById('peso-g').value = item.pesoG;
    } else if (item.tipo === 'area') {
        document.getElementById('largura-cm').value = item.larguraCm;
        document.getElementById('altura-cm').value = item.alturaCm;
    }

    // --- Remove o item original (vai ser readicionado no final do cadastro) ---
    materiais.splice(index, 1);
    atualizarTabelaMateriaisInsumos();

    // --- Scroll e foco ---
    document.getElementById('materiais-insumos').scrollIntoView({ behavior: 'smooth' });
     document.getElementById('titulo-materiais-insumos').textContent = 'Editar Material/Insumo';
}

function removerMaterialInsumo(index) {
    materiais.splice(index, 1);
    atualizarTabelaMateriaisInsumos();
    salvarDadosFirebase(); // Salva no Firebase após remover material
}

// --- Mão de Obra ---
function calcularValorHora() {
    const salario = parseFloat(document.getElementById('salario-receber').value);
    const horas = parseInt(document.getElementById('horas-trabalhadas').value);

    if (isNaN(salario) || isNaN(horas) || horas === 0) {
      document.getElementById('valor-hora').value = '';
      return;
    }

    const valorHora = salario / horas;
    document.getElementById('valor-hora').value = valorHora.toFixed(2);
    return valorHora;
}

function calcularCustoFerias13o() {
    const salario = parseFloat(document.getElementById('salario-receber').value);
    const horas = parseInt(document.getElementById('horas-trabalhadas').value);
    const incluir = document.getElementById('incluir-ferias-13o-sim').checked;

    let custoFerias13o = 0;
    if (incluir) {
        custoFerias13o = ((salario + (salario / 3)) / 12) / horas;
    }
    document.getElementById('custo-ferias-13o').value = custoFerias13o.toFixed(2);
     return custoFerias13o;
}

function salvarMaoDeObra() {
    const valorHora = calcularValorHora();

    if (valorHora === undefined) {
        alert('Preencha os campos de salário e horas corretamente.');
        return;
    }

    maoDeObra.salario = parseFloat(document.getElementById('salario-receber').value);
    maoDeObra.horas = parseInt(document.getElementById('horas-trabalhadas').value);
    maoDeObra.valorHora = valorHora;
    maoDeObra.incluirFerias13o = document.getElementById('incluir-ferias-13o-sim').checked;
    maoDeObra.custoFerias13o = calcularCustoFerias13o();

    document.getElementById('salario-receber').value = maoDeObra.salario;
    document.getElementById('horas-trabalhadas').value = maoDeObra.horas;
    document.getElementById('valor-hora').value = maoDeObra.valorHora.toFixed(2);
    document.getElementById('custo-ferias-13o').value = maoDeObra.custoFerias13o.toFixed(2);

    alert("Dados de mão de obra salvos com sucesso!");
    salvarDadosFirebase();// Salva no Firebase após salvar mão de obra

    modoEdicaoMaoDeObra = true;
    document.getElementById('btn-salvar-mao-de-obra').style.display = 'none';
    document.getElementById('btn-editar-mao-de-obra').style.display = 'inline-block';

    document.getElementById('titulo-mao-de-obra').textContent = 'Informações sobre custo de mão de obra';
    document.getElementById('salario-receber').readOnly = true;
    document.getElementById('horas-trabalhadas').readOnly = true;

     atualizarTabelaCustosIndiretos(); // <---  Atualiza após salvar
     calcularCustos(); // Importante para atualizar a seção de cálculo
}

function editarMaoDeObra() {
    modoEdicaoMaoDeObra = false;

    document.getElementById('salario-receber').readOnly = false;
    document.getElementById('horas-trabalhadas').readOnly = false;

    document.getElementById('btn-editar-mao-de-obra').style.display = 'none';
    document.getElementById('btn-salvar-mao-de-obra').style.display = 'inline-block';

    document.getElementById('mao-de-obra').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('titulo-mao-de-obra').textContent = 'Informações sobre custo de mão de obra';
}

document.getElementById('salario-receber').addEventListener('input', function(){
    calcularValorHora();
    calcularCustoFerias13o();
});
document.getElementById('horas-trabalhadas').addEventListener('input', function(){
    calcularValorHora();
    calcularCustoFerias13o();
    atualizarTabelaCustosIndiretos(); // <--- Atualiza a tabela aqui!
    calcularCustos();  // <-- Importantíssimo! Recalcula após mudar horas
});

// --- Custos Indiretos ---

function carregarCustosIndiretosPredefinidos() {
    const listaCustos = document.getElementById('lista-custos-indiretos');
    listaCustos.innerHTML = '';

    custosIndiretosPredefinidosBase.forEach((custoBase, index) => {
        const listItem = document.createElement('li');
        // Encontra o custo correspondente ou usa o custo base
        const custoAtual = custosIndiretosPredefinidos.find(c => c.descricao === custoBase.descricao) || { ...custoBase };
        listItem.innerHTML = `
            <div class="custo-item-nome">${custoBase.descricao}</div>
            <input type="number" id="custo-indireto-${index}" value="${custoAtual.valorMensal.toFixed(2)}" step="0.01">
            <button onclick="salvarCustoIndiretoPredefinido(${index})">Salvar</button>
        `;
        listaCustos.appendChild(listItem);
    });

    // Custos Adicionais
    custosIndiretosAdicionais.forEach((custo) => {
        const listItem = document.createElement('li');
        listItem.dataset.index = custo.tempIndex; // Importante para identificar na remoção
        listItem.innerHTML = `
            <div class="custo-item-nome">${custo.descricao}</div>
            <input type="number" value="${custo.valorMensal.toFixed(2)}" step="0.01">
            <button onclick="salvarNovoCustoIndiretoLista(this)" data-index="${custo.tempIndex}">Salvar</button>
            <button onclick="removerNovoCustoIndiretoLista(this)" data-index="${custo.tempIndex}">Remover</button>
        `;
        listaCustos.appendChild(listItem);
    });

    atualizarTabelaCustosIndiretos();
}

function salvarCustoIndiretoPredefinido(index) {
    const inputValor = document.getElementById(`custo-indireto-${index}`);
    const novoValor = parseFloat(inputValor.value);
    const descricao = custosIndiretosPredefinidosBase[index].descricao;  //Pega a descrição da base

    if (!isNaN(novoValor)) {
        // Atualiza o custo predefinido, usando a descrição para encontrar o objeto correto
        const custoParaAtualizar = custosIndiretosPredefinidos.find(c => c.descricao === descricao);
        if(custoParaAtualizar){
            custoParaAtualizar.valorMensal = novoValor;
        }
        atualizarTabelaCustosIndiretos();
        calcularCustos(); // <-- Importante! Recalcula após salvar custo indireto
        salvarDadosFirebase();// Salva no Firebase após salvar custo indireto predefinido
    } else {
        alert("Por favor, insira um valor numérico válido.");
    }
}

function adicionarNovoCustoIndireto() {
    const listaCustos = document.getElementById('lista-custos-indiretos');
    const novoIndex = `novoCusto-${novoCustoIndiretoCounter++}`; // ID único

    const listItem = document.createElement('li');
    listItem.dataset.index = novoIndex;  // Armazena o ID
    listItem.innerHTML = `
        <input type="text" class="custo-item-nome" placeholder="Descrição do novo custo">
        <input type="number" value="0.00" step="0.01">
        <button onclick="salvarNovoCustoIndiretoLista(this)" data-index="${novoIndex}">Salvar</button>
        <button onclick="removerNovoCustoIndiretoLista(this)" data-index="${novoIndex}">Remover</button>
    `;
    listaCustos.appendChild(listItem);
}

function salvarNovoCustoIndiretoLista(botao) {
    const listItem = botao.parentNode;
    const descricaoInput = listItem.querySelector('.custo-item-nome');
    const valorInput = listItem.querySelector('input[type="number"]');
    const index = botao.dataset.index; // Recupera o ID

    const descricao = descricaoInput.value.trim();
    const valorMensal = parseFloat(valorInput.value);

    if (descricao && !isNaN(valorMensal)) {
        // Procura se o custo já existe
        const custoExistenteIndex = custosIndiretosAdicionais.findIndex(c => c.tempIndex === index);

        if (custoExistenteIndex !== -1) {
            // Atualiza o custo existente
            custosIndiretosAdicionais[custoExistenteIndex] = { descricao: descricao, valorMensal: valorMensal, tempIndex: index };
        } else {
            // Adiciona o novo custo
            custosIndiretosAdicionais.push({ descricao: descricao, valorMensal: valorMensal, tempIndex: index };
        }
        atualizarTabelaCustosIndiretos(); // Atualiza a tabela
        calcularCustos();  // <-- Importante!
        salvarDadosFirebase();// Salva no Firebase após salvar novo custo indireto

    } else {
        alert("Por favor, preencha a descrição e insira um valor numérico válido.");
    }
}

function removerNovoCustoIndiretoLista(botaoRemover) {
    const listItem = botaoRemover.parentNode;
    const indexToRemove = botaoRemover.dataset.index; // Recupera o ID

    // Filtra o array, removendo o item com o ID correto
    custosIndiretosAdicionais = custosIndiretosAdicionais.filter(custo => custo.tempIndex !== indexToRemove);
    listItem.remove();
    atualizarTabelaCustosIndiretos();
    calcularCustos(); // <-- Importante!
    salvarDadosFirebase();// Salva no Firebase após remover novo custo indireto
}

function atualizarTabelaCustosIndiretos() {
    const tbody = document.querySelector('#tabela-custos-indiretos tbody');
    tbody.innerHTML = '';
    const horasTrabalhadas = maoDeObra.horas;

    if (horasTrabalhadas === undefined || horasTrabalhadas === null || horasTrabalhadas <= 0) {
        const row = tbody.insertRow();
        const cellMensagem = row.insertCell();
        cellMensagem.textContent = "Preencha as 'Horas trabalhadas por mês' no menu 'Custo de Mão de Obra' para calcular o custo por hora.";
        cellMensagem.colSpan = 4;
        return;
    }

    const custosExibicao = [...custosIndiretosPredefinidos, ...custosIndiretosAdicionais].filter(custo => custo.valorMensal > 0);
    const custosFiltrados = custosExibicao.filter(custo => custo.descricao.toLowerCase().includes(termoBusca));

   custosFiltrados.forEach((custo) => {
        const originalIndexPredefinidos = custosIndiretosPredefinidos.findIndex(c => c.descricao === custo.descricao);
        const originalAdicional = custosIndiretosAdicionais.find(c => c.descricao === custo.descricao && c.tempIndex === custo.tempIndex);


        if (custo.valorMensal > 0 || originalAdicional) {
            const row = tbody.insertRow();
            const cellDescricao = row.insertCell();
            const cellValorMensal = row.insertCell();
            const cellValorHoraTrabalhada = row.insertCell();
            const cellAcoes = row.insertCell();

            cellDescricao.textContent = custo.descricao;
            cellValorMensal.textContent = formatarMoeda(custo.valorMensal);

            const valorPorHora = custo.valorMensal / horasTrabalhadas;
            cellValorHoraTrabalhada.textContent = formatarMoeda(valorPorHora);

            // Usa o tipo e o índice/tempIndex corretos
            let botaoAcao;
            if (originalIndexPredefinidos !== -1) {
                botaoAcao = document.createElement('button');
                botaoAcao.textContent = 'Zerar';
                botaoAcao.onclick = function() { zerarCustoIndireto(originalIndexPredefinidos, 'predefinido'); };
            } else if (originalAdicional) {
                botaoAcao = document.createElement('button');
                botaoAcao.textContent = 'Zerar'; // Usa "Zerar" em vez de "Remover"
                botaoAcao.onclick = function() { zerarCustoIndireto(custo.tempIndex, 'adicional'); };
            }

            cellAcoes.appendChild(botaoAcao);

        }
    });
}

// --- Produtos Cadastrados ---
function cadastrarProduto() {
    const nomeProduto = document.getElementById('nome-produto').value;
    const tabelaMateriaisProduto = document.getElementById('tabela-materiais-produto').querySelector('tbody');
    const linhasMateriais = tabelaMateriaisProduto.rows;

    if (!nomeProduto || linhasMateriais.length === 0) {
        alert("Por favor, preencha o nome do produto e adicione pelo menos um material.");
        return;
    }

    let materiaisDoProduto = [];
    let custoTotalMateriaisProduto = 0;

    for (let i = 0; i < linhasMateriais.length; i++) {
        const linha = linhasMateriais[i];
        const nomeMaterial = linha.cells[0].textContent;
        const tipoMaterial = linha.cells[1].textContent.split(' ')[0]; // Pega só a primeira parte (tipo)
        const custoUnitarioMaterial = parseFloat(linha.cells[2].textContent.replace(/[^\d.,-]/g, '').replace('.', '').replace(',', '.'));

        // --- DIMENSOES (agora em sua própria célula) ---
        const larguraInput = linha.cells[3].querySelector('.dimensoes-input.largura');
        const alturaInput = linha.cells[3].querySelector('.dimensoes-input.altura');
        const comprimentoInput = linha.cells[3].querySelector('.dimensoes-input.comprimento'); //Se for comprimento

        const largura = larguraInput ? parseFloat(larguraInput.value) : 0;
        const altura = alturaInput ? parseFloat(alturaInput.value) : 0;
        const comprimento = comprimentoInput? parseFloat(comprimentoInput.value) : 0;


        // --- QUANTIDADE (agora separada das dimensões) ---
        const inputQuantidade = linha.cells[4].querySelector('.quantidade-input');  // Célula 4
        let quantidadeMaterial = quantidadeInput ? parseFloat(quantidadeInput.value) : 0;


        // --- CÁLCULO DO CUSTO TOTAL (CORREÇÃO AQUI) ---
        let custoTotalMaterial = 0;
        if (tipoMaterial === 'Área') {
            const area = (largura * altura) / 10000; // Calcula a área em m²
            custoTotalMaterial = custoUnitarioMaterial * area;
        } else if (tipoMaterial === 'Comprimento') {
            // CONVERTE comprimento de cm para m ANTES de calcular o custo
            const comprimentoEmMetros = comprimento / 100;
            custoTotalMaterial = custoUnitarioMaterial * comprimentoEmMetros; // Usa o comprimento em METROS
        } else {
          custoTotalMaterial = custoUnitarioMaterial * quantidadeMaterial;
        }


        materiaisDoProduto.push({
            nome: nomeMaterial,
            tipo: tipoMaterial,
            custoUnitario: custoUnitarioMaterial,
            largura: largura,      // Valor da largura
            altura: altura,       // Valor da altura
            comprimento: comprimento, //Comprimento *em cm* (para consistência e edição)
            quantidade: quantidadeMaterial, // Valor da QUANTIDADE (separado)
            custoTotal: custoTotalMaterial
        });
        custoTotalMateriaisProduto += custoTotalMaterial;
    }

    const produto = {
        nome: nomeProduto,
        materiais: materiaisDoProduto,
        custoMateriais: custoTotalMateriaisProduto
    };
    produtos.push(produto);

    atualizarTabelaProdutosCadastrados();
    limparFormulario('form-produtos-cadastrados');
    tabelaMateriaisProduto.innerHTML = '';
    salvarDadosFirebase();// Salva no Firebase após cadastrar produto
    alert('Produto cadastrado com sucesso!');
}

function atualizarTabelaProdutosCadastrados() {
    const tbody = document.querySelector('#tabela-produtos tbody');
    tbody.innerHTML = '';

    produtos.forEach((produto, index) => {
        const row = tbody.insertRow();
        const cellNomeProduto = row.insertCell();
        const cellMateriaisUtilizados = row.insertCell();
        const cellCustoTotalMateriais = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNomeProduto.textContent = produto.nome;

        let listaMateriaisHTML = '<ul>';
        produto.materiais.forEach(material => {
            let dimensoesTexto = '';
            if (material.tipo === 'Área') {
                dimensoesTexto = `(${material.largura.toFixed(2)}cm x ${material.altura.toFixed(2)}cm)`;
            } else if (material.tipo === 'Comprimento') {
                dimensoesTexto = `(${material.comprimento.toFixed(2)}cm)`;
            }
            listaMateriaisHTML += `<li>${material.nome} ${dimensoesTexto} - ${formatarMoeda(material.custoTotal)} (Qtd: ${material.quantidade.toFixed(2)})</li>`;
        });
        listaMateriaisHTML += '</ul>';
        cellMateriaisUtilizados.innerHTML = listaMateriaisHTML;
        cellCustoTotalMateriais.textContent = formatarMoeda(produto.custoMateriais);

        const botaoEditarProduto = document.createElement('button');
        botaoEditarProduto.textContent = 'Editar';
        botaoEditarProduto.addEventListener('click', function() {
            editarProduto(index);
        });
        cellAcoes.appendChild(botaoEditarProduto);

        const botaoRemoverProduto = document.createElement('button');
        botaoRemoverProduto.textContent = 'Remover';
        botaoRemoverProduto.addEventListener('click', function() {
            removerProduto(index);
        });
        cellAcoes.appendChild(botaoRemoverProduto);
    });
}

function buscarProdutosCadastrados() {
    const termoBusca = document.getElementById('busca-produto').value.toLowerCase();
    const tbody = document.querySelector('#tabela-produtos tbody');
    tbody.innerHTML = '';

    const produtosFiltrados = produtos.filter(produto => produto.nome.toLowerCase().includes(termoBusca));

    produtosFiltrados.forEach((produto, index) => {
		const row = tbody.insertRow();
        const cellNomeProduto = row.insertCell();
        const cellMateriaisUtilizados = row.insertCell();
        const cellCustoTotalMateriais = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNomeProduto.textContent = produto.nome;

        let listaMateriaisHTML = '<ul>';
        produto.materiais.forEach(material => {
			//Modificação para exibir largura e altura.
            let dimensoesTexto = '';
            if (material.tipo === 'Área') {
                dimensoesTexto = `(${material.largura.toFixed(2)}cm x ${material.altura.toFixed(2)}cm)`;
            }else if (material.tipo === 'Comprimento') {
                dimensoesTexto = `(${material.comprimento.toFixed(2)}cm)`; //Mostra o comprimento
            }
            listaMateriaisHTML += `<li>${material.nome} ${dimensoesTexto} - ${formatarMoeda(material.custoTotal)} (Qtd: ${material.quantidade.toFixed(2)})</li>`;
        });
        listaMateriaisHTML += '</ul>';
        cellMateriaisUtilizados.innerHTML = listaMateriaisHTML;
        cellCustoTotalMateriais.textContent = formatarMoeda(produto.custoMateriais);

        const botaoEditarProduto = document.createElement('button');
        botaoEditarProduto.textContent = 'Editar';
        botaoEditarProduto.addEventListener('click', function() {
            editarProduto(index);
        });
        cellAcoes.appendChild(botaoEditarProduto);

        const botaoRemoverProduto = document.createElement('button');
        botaoRemoverProduto.textContent = 'Remover';
        botaoRemoverProduto.addEventListener('click', function() {
            removerProduto(index);
        });
        cellAcoes.appendChild(botaoRemoverProduto);
    });
}

function adicionarMaterialNaTabelaProduto(material) {
    const tbody = document.querySelector('#tabela-materiais-produto tbody');
    const row = tbody.insertRow();
    const cellNome = row.insertCell();
    const cellTipo = row.insertCell();
    const cellCustoUnitario = row.insertCell();
    const cellDimensoes = row.insertCell();
    const cellQuantidade = row.insertCell();
    const cellCustoTotal = row.insertCell();
    const cellAcoes = row.insertCell();

    cellNome.textContent = material.nome;
    let unidade = '';
    switch (material.tipo) {
        case 'comprimento': unidade = ' (m)'; break;
        case 'litro': unidade = ' (L)'; break;
        case 'quilo': unidade = ' (kg)'; break;
        case 'unidade': unidade = ' (un)'; break;
        case 'area': unidade = ' (m²)'; break;
    }
    cellTipo.textContent = material.tipo.charAt(0).toUpperCase() + material.tipo.slice(1) + unidade;
    cellCustoUnitario.textContent = formatarMoeda(material.custoUnitario);

    // --- Campos de Dimensões (Largura, Altura e Comprimento) ---
    // MODIFICAÇÃO AQUI: Adiciona a unidade de medida ao placeholder
    let larguraInput, alturaInput, comprimentoInput;

    if (material.tipo === 'area') {
        larguraInput = document.createElement('input');
        larguraInput.type = 'number';
        larguraInput.placeholder = 'Largura (cm)'; // Adiciona (cm)
        larguraInput.min = 0.01;
        larguraInput.step = 0.01;
        larguraInput.classList.add('dimensoes-input', 'largura');
        larguraInput.value = material.largura || '';

        alturaInput = document.createElement('input');
        alturaInput.type = 'number';
        alturaInput.placeholder = 'Altura (cm)'; // Adiciona (cm)
        alturaInput.min = 0.01;
        alturaInput.step = 0.01;
        alturaInput.classList.add('dimensoes-input', 'altura');
        alturaInput.value = material.altura || '';

        cellDimensoes.appendChild(larguraInput);
        cellDimensoes.appendChild(alturaInput);

    } else if (material.tipo === 'comprimento') {
        comprimentoInput = document.createElement('input');
        comprimentoInput.type = 'number';
        comprimentoInput.placeholder = 'Comprimento (cm)'; // Adiciona (cm)
        comprimentoInput.min = 0.01;
        comprimentoInput.step = 0.01;
        comprimentoInput.classList.add('dimensoes-input', 'comprimento');
        comprimentoInput.value = material.comprimento || '';
        cellDimensoes.appendChild(comprimentoInput);
    }
    // --- Campo de Quantidade (AGORA SEPARADO) ---
    const inputQuantidade = document.createElement('input');
    inputQuantidade.type = 'number';
    inputQuantidade.value = material.quantidade || 1;
    inputQuantidade.min = 0.01;
    inputQuantidade.step = 0.01;
    inputQuantidade.classList.add('quantidade-input');
    inputQuantidade.readOnly = material.tipo === 'area';


    const unidadeMedidaSpan = document.createElement('span');
    unidadeMedidaSpan.classList.add('unidade-medida');
    // --- Lógica para Área (agora calcula e exibe a área corretamente) ---
    if (material.tipo === 'area') {
        const areaSpan = document.createElement('span');
        areaSpan.classList.add('dimensoes-span');
        cellDimensoes.appendChild(areaSpan);
        unidadeMedidaSpan.textContent = '';

        // Função para calcular a área e atualizar o custo total
        function calcularAreaEAtualizar() {
            const largura = parseFloat(larguraInput.value) || 0;
            const altura = parseFloat(alturaInput.value) || 0;

            if (isNaN(largura) || largura <= 0 || isNaN(altura) || altura <= 0) {
                areaSpan.textContent = '0.00 m²';
                inputQuantidade.value = 0;
                calcularCustoTotalMaterial();
                return;
            }

            const area = (largura * altura) / 10000;
            areaSpan.textContent = area.toFixed(2) + ' m²';
            inputQuantidade.value = area.toFixed(2);
            calcularCustoTotalMaterial();
        }

        larguraInput.addEventListener('input', calcularAreaEAtualizar);
        alturaInput.addEventListener('input', calcularAreaEAtualizar);

        calcularAreaEAtualizar();

    } else if(material.tipo === 'comprimento'){
        const comprimentoSpan = document.createElement('span');
        comprimentoSpan.classList.add('dimensoes-span');
        cellDimensoes.appendChild(comprimentoSpan);
        unidadeMedidaSpan.textContent = '';

        function calcularComprimentoEAtualizar(){
            const comprimento = parseFloat(comprimentoInput.value) || 0;

            if(isNaN(comprimento) || comprimento <= 0){
                comprimentoSpan.textContent = '0.00 cm';
                inputQuantidade.value = 0;
                calcularCustoTotalMaterial();
                return;
            }

            comprimentoSpan.textContent = comprimento.toFixed(2) + ' cm';
            inputQuantidade.value = comprimento.toFixed(2);
            calcularCustoTotalMaterial();
        }
        comprimentoInput.addEventListener('input', calcularComprimentoEAtualizar);
        calcularComprimentoEAtualizar();

    }else {
        unidadeMedidaSpan.textContent = unidade;
        inputQuantidade.addEventListener('input', calcularCustoTotalMaterial);
    }

    cellQuantidade.appendChild(inputQuantidade);
    cellQuantidade.appendChild(unidadeMedidaSpan);


    // --- Função para calcular o custo total ---
    function calcularCustoTotalMaterial() {
        let quantidade = parseFloat(inputQuantidade.value);
         if (isNaN(quantidade) || quantidade <= 0) {
            if(material.tipo !== 'area' && material.tipo !== 'comprimento'){
                quantidade = 0.01;
                inputQuantidade.value = quantidade;
            } else{
                quantidade = 0;
            }
        }

        let custoTotal = 0;
        if(material.tipo === "area"){
            const largura = parseFloat(larguraInput.value) || 0;
            const altura = parseFloat(alturaInput.value) || 0;
            const area = (largura * altura) / 10000;
            custoTotal = material.custoUnitario * area;

        } else if(material.tipo === "comprimento") {
            const comprimento = parseFloat(comprimentoInput.value) || 0;
            const comprimentoEmMetros = comprimento / 100;
            custoTotal = material.custoUnitario * comprimentoEmMetros;

        } else {
          custoTotal = material.custoUnitario * quantidade;
        }

        cellCustoTotal.textContent = formatarMoeda(custoTotal);
    }

    calcularCustoTotalMaterial();


    const botaoRemoverMaterial = document.createElement('button');
    botaoRemoverMaterial.textContent = 'Remover';
    botaoRemoverMaterial.addEventListener('click', function() {
        removerLinhaMaterial(row);
    });
    cellAcoes.appendChild(botaoRemoverMaterial);
}

function editarProduto(index) {
    const produto = produtos[index];
    if (!produto) return;

    document.getElementById('nome-produto').value = produto.nome;

    const tabelaMateriaisProdutoBody = document.querySelector('#tabela-materiais-produto tbody');
    tabelaMateriaisProdutoBody.innerHTML = '';

    produto.materiais.forEach(material => {
        adicionarMaterialNaTabelaProduto(material);
    });

    produtos.splice(index, 1);
    atualizarTabelaProdutosCadastrados();
    salvarDadosFirebase();// Salva no Firebase após editar produto
    document.getElementById('produtos-cadastrados').scrollIntoView({ behavior: 'smooth' });
    document.querySelector('#produtos-cadastrados h2').textContent = 'Editar Produto';
}

function removerProduto(index) {
    produtos.splice(index, 1);
    atualizarTabelaProdutosCadastrados();
    salvarDadosFirebase();// Salva no Firebase após remover produto
}

// --- Pesquisa e Adição de Materiais na Seção Produtos ---
document.getElementById('pesquisa-material').addEventListener('input', function() {
    const termoPesquisa = this.value.toLowerCase();
    const resultadosPesquisaDiv = document.getElementById('resultados-pesquisa');
    resultadosPesquisaDiv.innerHTML = '';

    if (termoPesquisa.length < 2) {
        resultadosPesquisaDiv.style.display = 'none';
        return;
    }

    const materiaisFiltrados = materiais.filter(material => material.nome.toLowerCase().includes(termoPesquisa));

    if (materiaisFiltrados.length > 0) {
        resultadosPesquisaDiv.style.display = 'block';
        materiaisFiltrados.forEach(material => {
            const resultadoDiv = document.createElement('div');
            resultadoDiv.textContent = material.nome + ' (' + material.tipo + ') - Custo Unitário: ' + formatarMoeda(material.custoUnitario);
            resultadoDiv.addEventListener('click', function() {
                adicionarMaterialNaTabelaProduto(material);
                document.getElementById('pesquisa-material').value = '';
                resultadosPesquisaDiv.innerHTML = '';
                resultadosPesquisaDiv.style.display = 'none';
                salvarDadosFirebase();// Salva no Firebase após adicionar material na tabela de produtos
            });
            resultadosPesquisaDiv.appendChild(resultadoDiv);
        });
    } else {
        resultadosPesquisaDiv.style.display = 'none';
    }
});

function removerLinhaMaterial(row) {
    row.remove();
     salvarDadosFirebase();// Salva no Firebase após remover linha de material
}

// --- Cálculo da Precificação (Refatorado) ---

function buscarProdutosAutocomplete() {
    const termo = document.getElementById('produto-pesquisa').value.toLowerCase();
    const resultadosDiv = document.getElementById('produto-resultados');
    resultadosDiv.innerHTML = ''; // Limpa resultados anteriores
    resultadosDiv.classList.remove('hidden'); //Mostra a div

    if (termo.length < 2) {
        resultadosDiv.classList.add('hidden'); //Esconde se termo muito curto.
        return; // Sai se o termo for muito curto
    }

    const produtosFiltrados = produtos.filter(produto => produto.nome.toLowerCase().includes(termo));

    if (produtosFiltrados.length > 0) {
        produtosFiltrados.forEach(produto => {
            const div = document.createElement('div');
            div.textContent = produto.nome;
            div.addEventListener('click', function() {
                selecionarProduto(produto.nome); // Função para selecionar
                resultadosDiv.classList.add('hidden'); // Esconde após seleção
            });
            resultadosDiv.appendChild(div);
        });
    } else {
       resultadosDiv.classList.add('hidden'); //Esconde caso não encontre.
    }
}

function selecionarProduto(nomeProduto) {
    document.getElementById('produto-pesquisa').value = nomeProduto; // Preenche o campo
    carregarDadosProduto(nomeProduto); // Carrega os dados (custo)
}

function carregarDadosProduto(nomeProduto) {
    const produto = produtos.find(p => p.nome === nomeProduto);

    if (produto) {
        document.getElementById('custo-produto').textContent = formatarMoeda(produto.custoMateriais);
        // Exibe os detalhes do produto (materiais)
        const detalhesProdutoDiv = document.getElementById('detalhes-produto');
        const listaMateriais = document.getElementById('lista-materiais-produto');
        listaMateriais.innerHTML = ''; // Limpa a lista

        produto.materiais.forEach(material => {
            //Modificação para exibir largura e altura
			let dimensoesTexto = '';
            if (material.tipo === 'Área') {
                dimensoesTexto = `(${material.largura.toFixed(2)}cm x ${material.altura.toFixed(2)}cm)`;
            }else if (material.tipo === 'Comprimento') {
                dimensoesTexto = `(${material.comprimento.toFixed(2)}cm)`; //Mostra o comprimento
            }
            const li = document.createElement('li');
            li.textContent = `${material.nome} ${dimensoesTexto} (${material.tipo}) - Qtd: ${material.quantidade.toFixed(2)} - Custo: ${formatarMoeda(material.custoTotal)}`;  //Quantidade com 2 casas
            listaMateriais.appendChild(li);
        });
        detalhesProdutoDiv.style.display = 'block'; // Mostra a div

        calcularCustos(); // Recalcula *tudo*
    } else {
        document.getElementById('custo-produto').textContent = 'R$ 0,00';
         document.getElementById('detalhes-produto').style.display = 'none'; // Esconde se não tiver produto
    }
}

function calcularCustos() {
    const horasProduto = parseFloat(document.getElementById('horas-produto').value) || 0;

    // 1. Custo de Mão de Obra (DETALHADO)
    const custoMaoDeObra = maoDeObra.valorHora * horasProduto;
    const custoFerias13o = maoDeObra.custoFerias13o * horasProduto;
    const totalMaoDeObra = custoMaoDeObra + custoFerias13o;

    document.getElementById('custo-mao-de-obra-detalhe').textContent = formatarMoeda(custoMaoDeObra);
    document.getElementById('custo-ferias-13o-detalhe').textContent = formatarMoeda(custoFerias13o);
    document.getElementById('total-mao-de-obra').textContent = formatarMoeda(totalMaoDeObra);


    // 2. Custo do Produto (já é carregado em carregarDadosProduto)

    // 3. Custos Indiretos (DETALHADO, por item, e SÓ SE > 0)
    let custoIndiretoTotalProduto = 0;
    const listaCustosIndiretosDetalhes = document.getElementById('lista-custos-indiretos-detalhes');
    listaCustosIndiretosDetalhes.innerHTML = ''; // Limpa a lista

    custosIndiretosPredefinidos.forEach(custo => {
        const custoPorHora = custo.valorMensal / maoDeObra.horas;
        const custoItemProduto = custoPorHora * horasProduto;

        // AQUI: Só adiciona à lista se o custo for > 0
        if (custoItemProduto > 0) {
            custoIndiretoTotalProduto += custoItemProduto;
            const li = document.createElement('li');
            li.textContent = `${custo.descricao}: ${formatarMoeda(custoItemProduto)}`;
            listaCustosIndiretosDetalhes.appendChild(li);
        }
    });

    custosIndiretosAdicionais.forEach(custo => {
        const custoPorHora = custo.valorMensal / maoDeObra.horas;
        const custoItemProduto = custoPorHora * horasProduto;

        // AQUI: Só adiciona à lista se o custo for > 0
        if (custoItemProduto > 0) {
            custoIndiretoTotalProduto += custoItemProduto;
            const li = document.createElement('li');
            li.textContent = `${custo.descricao}: ${formatarMoeda(custoItemProduto)}`;
            listaCustosIndiretosDetalhes.appendChild(li);
        }
    });

     document.getElementById('custo-indireto').textContent = formatarMoeda(custoIndiretoTotalProduto); // Total (por hora)

    // 4. Subtotal
    const nomeProduto = document.getElementById('produto-pesquisa').value;
    const produto = produtos.find(p => p.nome === nomeProduto);
    const custoProduto = produto ? produto.custoMateriais : 0;
    const subtotal = custoProduto + totalMaoDeObra + custoIndiretoTotalProduto;
    document.getElementById('subtotal').textContent = formatarMoeda(subtotal);

    calcularPrecoVendaFinal(); //Chama para já calcular com os novos valores.
}

function calcularPrecoVendaFinal(){
   const margemLucro = parseFloat(document.getElementById('margem-lucro-final').value) / 100 || 0;
    const subtotalTexto = document.getElementById('subtotal').textContent;

    // Converte o subtotal para um número, tratando a formatação de moeda
    const subtotalNumerico = parseFloat(subtotalTexto.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.')) || 0;
    const precoVenda = subtotalNumerico * (1 + margemLucro);
     const margemLucroValor = precoVenda - subtotalNumerico; //Calcula a margem
    document.getElementById('margem-lucro-valor').textContent = formatarMoeda(margemLucroValor);
    document.getElementById('total-final').textContent = formatarMoeda(precoVenda);

    calcularTotalComTaxas(); //Chama a função para o cálculo final.
}

// --- Função para Taxa de Crédito ---
function salvarTaxaCredito() {
    const incluir = document.getElementById('incluir-taxa-credito-sim').checked;
    const percentual = parseFloat(document.getElementById('taxa-credito-percentual').value);

    if (incluir && (isNaN(percentual) || percentual < 0)) {
        alert("Por favor, insira um valor percentual válido para a taxa.");
        return;
    }

    taxaCredito.incluir = incluir;
    taxaCredito.percentual = incluir ? percentual : 0; //Salva 0 se não incluir.
    calcularTotalComTaxas(); //Recalcula o total com a nova taxa.
    salvarDadosFirebase();// Salva no Firebase após salvar taxa de crédito
}

function calcularTotalComTaxas() {
    const precoVendaTexto = document.getElementById('total-final').textContent; //Pega do total com margem.
    const precoVendaNumerico = parseFloat(precoVendaTexto.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.')) || 0;

    let taxaCreditoValor = 0;
    if (taxaCredito.incluir) {
        taxaCreditoValor = precoVendaNumerico * (taxaCredito.percentual / 100);
    }
    document.getElementById('taxa-credito-valor').textContent = formatarMoeda(taxaCreditoValor);

    const totalFinalComTaxas = precoVendaNumerico + taxaCreditoValor;
    document.getElementById('total-final-com-taxas').textContent = formatarMoeda(totalFinalComTaxas);
}

// Event Listeners (ajustado)
document.addEventListener('DOMContentLoaded', () => {

    // Não precisa mais carregar produtos em um <select>

    // Evento para o autocomplete
    document.getElementById('produto-pesquisa').addEventListener('input', buscarProdutosAutocomplete);

    // Eventos para cálculo
    document.getElementById('horas-produto').addEventListener('input', calcularCustos);
     document.getElementById('margem-lucro-final').addEventListener('input', calcularPrecoVendaFinal);

     //Eventos para a taxa
     document.getElementById('incluir-taxa-credito-sim').addEventListener('change', salvarTaxaCredito);
      document.getElementById('incluir-taxa-credito-nao').addEventListener('change', salvarTaxaCredito);
     document.getElementById('taxa-credito-percentual').addEventListener('input', salvarTaxaCredito);
});

//Para esconder o autocomplete quando clica fora.
document.addEventListener('click', function(event) {
    const autocompleteDiv = document.getElementById('produto-resultados');
    const inputPesquisa = document.getElementById('produto-pesquisa');

    if (event.target !== autocompleteDiv && event.target !== inputPesquisa) {
        autocompleteDiv.classList.add('hidden');
    }
});
```

**`precificacao.js`:**

```javascript
/* Variáveis globais */
let materiais = [];
let maoDeObra = { salario: 0, horas: 220, valorHora: 0, incluirFerias13o: false, custoFerias13o: 0 }; // Horas padrão 220h
let custosIndiretosPredefinidosBase = [ // This is the base template, never modified
    { descricao: "Energia elétrica", valorMensal: 0 },
    { descricao: "Água", valorMensal: 0 },
    { descricao: "Gás", valorMensal: 0 },
    { descricao: "Aluguel do espaço", valorMensal: 0 },
    { descricao: "Depreciação de máquinas e equipamentos", valorMensal: 0 },
    { descricao: "Manutenção predial e de equipamentos", valorMensal: 0 },
    { descricao: "Despesas com segurança", valorMensal: 0 },
    { descricao: "Limpeza e conservação", valorMensal: 0 },
    { descricao: "Material de escritório", valorMensal: 0 },
    { descricao: "Impostos e taxas indiretos", valorMensal: 0 },
    { descricao: "Marketing institucional", valorMensal: 0 },
    { descricao: "Transporte e logística", valorMensal: 0 },
    { descricao: "Despesas com utilidades", valorMensal: 0 },
    { descricao: "Demais custos administrativos", valorMensal: 0 }
];
let custosIndiretosPredefinidos = JSON.parse(JSON.stringify(custosIndiretosPredefinidosBase)); // Working copy, modified by user inputs
let custosIndiretosAdicionais = [];
let produtos = [];
let modoEdicaoMaoDeObra = false;
let itemEdicaoCustoIndireto = null;
let novoCustoIndiretoCounter = 0; // Contador para IDs únicos de custos indiretos adicionais
let taxaCredito = {percentual: 6, incluir: false}; //Objeto para taxa de crédito


/* Formatação de valores em moeda */
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* Exibir a subpágina desejada */
function mostrarSubMenu(submenuId) {
    const conteudos = ['materiais-insumos', 'mao-de-obra', 'custos-indiretos', 'produtos-cadastrados', 'calculo-precificacao'];
    conteudos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = 'none';
        }
    });
    const submenu = document.getElementById(submenuId);
    if (submenu) {
        submenu.style.display = 'block';
    }
}

/* Limpar formulário */
function limparFormulario(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

/* Monitorar os radios para exibir os campos corretos */
document.querySelectorAll('input[name="tipo-material"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const camposComprimento = document.getElementById('campos-comprimento');
        const camposLitro = document.getElementById('campos-litro');
        const camposQuilo = document.getElementById('campos-quilo');
        const camposArea = document.getElementById('campos-area');

        camposComprimento.style.display = 'none';
        camposLitro.style.display = 'none';
        camposQuilo.style.display = 'none';
        camposArea.style.display = 'none';

        if (this.value === "comprimento") {
            camposComprimento.style.display = "block";
        } else if (this.value === "litro") {
            camposLitro.style.display = "block";
        } else if (this.value === "quilo") {
            camposQuilo.style.display = "block";
        } else if (this.value === "area") {
            camposArea.style.display = "block";
        }
    });
});

/* Função para calcular o custo unitário com base nas fórmulas */
function calcularCustoUnitario(tipo, valorTotal, comprimentoCm, volumeMl, pesoG, larguraCm, alturaCm) {
    let custoUnitario = 0;
    switch (tipo) {
        case "comprimento":
            custoUnitario = valorTotal / (comprimentoCm / 100);  // Divide por 100 para converter cm para m
            break;
        case "litro":
            custoUnitario = valorTotal / (volumeMl / 1000); // Divide por 1000 para converter ml para L
            break;
        case "quilo":
            custoUnitario = valorTotal / (pesoG / 1000);  // Divide por 1000 para converter g para kg
            break;
        case "unidade":
            custoUnitario = valorTotal;
            break;
        case "area":
            // A área já é calculada em m² em cadastrarMaterialInsumo
            custoUnitario = valorTotal / ((larguraCm/100) * (alturaCm/100)); // Divide o valor total pela área em m²
            break;
    }
    return custoUnitario;
}

/* Cadastrar Material/Insumo */
function cadastrarMaterialInsumo() {
    const nome = document.getElementById('nome-material').value.trim();
    const valorTotal = parseFloat(document.getElementById('valor-total-material').value);
    const tipo = document.querySelector('input[name="tipo-material"]:checked').value;
    let comprimentoCm = 0, volumeMl = 0, pesoG = 0, larguraCm = 0, alturaCm = 0;

    // --- Validação de entrada (mantido) ---
    if (!nome) {
        alert("Por favor, insira um nome para o material.");
        return;
    }
    if (isNaN(valorTotal) || valorTotal <= 0) {
        alert("Por favor, insira um valor total válido (maior que zero).");
        return;
    }

    // --- Coleta e validação de dimensões (mantido) ---
    if (tipo === 'comprimento') {
        comprimentoCm = parseFloat(document.getElementById('comprimento-cm').value);
        if (isNaN(comprimentoCm) || comprimentoCm <= 0) {
            alert("Por favor, insira um comprimento válido (maior que zero).");
            return;
        }
    } else if (tipo === 'litro') {
        volumeMl = parseFloat(document.getElementById('volume-ml').value);
        if (isNaN(volumeMl) || volumeMl <= 0) {
            alert("Por favor, insira um volume válido (maior que zero).");
            return;
        }
    } else if (tipo === 'quilo') {
        pesoG = parseFloat(document.getElementById('peso-g').value);
        if (isNaN(pesoG) || pesoG <= 0) {
            alert("Por favor, insira um peso válido (maior que zero).");
            return;
        }
    } else if (tipo === 'area') {
        larguraCm = parseFloat(document.getElementById('largura-cm').value);
        alturaCm = parseFloat(document.getElementById('altura-cm').value);
        if (isNaN(larguraCm) || larguraCm <= 0 || isNaN(alturaCm) || alturaCm <= 0) {
            alert("Por favor, insira dimensões válidas para a área (maiores que zero).");
            return;
        }
    }

    // --- Cálculo do Custo Unitário (mantido) ---
    const custoUnitario = calcularCustoUnitario(tipo, valorTotal, comprimentoCm, volumeMl, pesoG, larguraCm, alturaCm);

    // --- Criação do objeto do material (mantido) ---
    const item = {
        nome,
        tipo,
        custoUnitario,
        comprimentoCm,
        volumeMl,
        pesoG,
        larguraCm,
        alturaCm
    };

    // 1. Adiciona o item ao array de materiais.
    materiais.push(item);

    // 2. Atualiza a tabela *ANTES* de resetar o formulário.
    atualizarTabelaMateriaisInsumos();

    // 3. Salva os dados no Firebase (incluindo os materiais)
    salvarDadosFirebase();

    // 4. Limpa *todos* os campos do formulário.
    limparFormulario('form-materiais-insumos');

    // 5. Reseta o título do formulário.
    document.getElementById('titulo-materiais-insumos').textContent = "Cadastro de Materiais e Insumos";

    // 6. Seleciona o radio button "Comprimento" *e* dispara o evento 'change'.
    const radioComprimento = document.querySelector('input[name="tipo-material"][value="comprimento"]');
    radioComprimento.checked = true;
    radioComprimento.dispatchEvent(new Event('change')); // <-- Importante!

    // 7. Garante que o placeholder do comprimento esteja correto (cm).
    document.getElementById('comprimento-cm').placeholder = "Comprimento (cm)";

}

/* Atualizar a tabela de Materiais e Insumos */
function atualizarTabelaMateriaisInsumos() {
    const tbody = document.querySelector('#tabela-materiais-insumos tbody');
    tbody.innerHTML = '';
    materiais.forEach((item, index) => {
        const row = tbody.insertRow();
        const cellNome = row.insertCell();
        const cellTipo = row.insertCell();
        const cellCustoUnit = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNome.textContent = item.nome;
        cellTipo.textContent =
            (item.tipo === 'comprimento' ? 'Comprimento (Metro)' :
                item.tipo === 'litro' ? 'Litro' :
                    item.tipo === 'quilo' ? 'Quilo' :
                        item.tipo === 'area' ? 'Área (m²)' : 'Unidade');
        cellCustoUnit.textContent = formatarMoeda(item.custoUnitario);

        // Botão Editar
        const botaoEditar = document.createElement('button');
        botaoEditar.textContent = 'Editar';
        botaoEditar.addEventListener('click', function() {
            editarMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoEditar);

        // Botão Remover
        const botaoRemover = document.createElement('button');
        botaoRemover.textContent = 'Remover';
        botaoRemover.addEventListener('click', function() {
            removerMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoRemover);
    });
}

// Função para buscar materiais cadastrados
function buscarMateriaisCadastrados() {
    const termoBusca = document.getElementById('busca-material').value.toLowerCase();
    const tbody = document.querySelector('#tabela-materiais-insumos tbody');
    tbody.innerHTML = '';

    const materiaisFiltrados = materiais.filter(item => item.nome.toLowerCase().includes(termoBusca));

    materiaisFiltrados.forEach((item, index) => {
        const row = tbody.insertRow();
        const cellNome = row.insertCell();
        const cellTipo = row.insertCell();
        const cellCustoUnit = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNome.textContent = item.nome;
        cellTipo.textContent = item.tipo;
        cellCustoUnit.textContent = formatarMoeda(item.custoUnitario);

        // Botão Editar
        const botaoEditar = document.createElement('button');
        botaoEditar.textContent = 'Editar';
        botaoEditar.addEventListener('click', function() {
            editarMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoEditar);

        // Botão Remover
        const botaoRemover = document.createElement('button');
        botaoRemover.textContent = 'Remover';
        botaoRemover.addEventListener('click', function() {
            removerMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoRemover);
    });
}

function editarMaterialInsumo(index) {
    const item = materiais[index];

    // --- Preenche os campos do formulário ---
    document.getElementById('nome-material').value = item.nome;
    document.getElementById('valor-total-material').value = item.tipo === 'area' ? item.custoUnitario * ((item.larguraCm/100) * (item.alturaCm/100)) : item.custoUnitario;  //Mantem o valor total.

    // Seleciona o radio button correto *e* dispara o evento 'change'
    const radio = document.querySelector(`input[name="tipo-material"][value="${item.tipo}"]`);
    radio.checked = true;
    radio.dispatchEvent(new Event('change')); //  <-- Importante!

    // Preenche os campos de dimensão (se existirem)
    if (item.tipo === 'comprimento') {
        document.getElementById('comprimento-cm').value = item.comprimentoCm;
    } else if (item.tipo === 'litro') {
        document.getElementById('volume-ml').value = item.volumeMl;
    } else if (item.tipo === 'quilo') {
        document.getElementById('peso-g').value = item.pesoG;
    } else if (item.tipo === 'area') {
        document.getElementById('largura-cm').value = item.larguraCm;
        document.getElementById('altura-cm').value = item.alturaCm;
    }

    // --- Remove o item original (vai ser readicionado no final do cadastro) ---
    materiais.splice(index, 1);
    atualizarTabelaMateriaisInsumos();

    // --- Scroll e foco ---
    document.getElementById('materiais-insumos').scrollIntoView({ behavior: 'smooth' });
     document.getElementById('titulo-materiais-insumos').textContent = 'Editar Material/Insumo';
}

function removerMaterialInsumo(index) {
    materiais.splice(index, 1);
    atualizarTabelaMateriaisInsumos();
    salvarDadosFirebase(); // Salva no Firebase após remover material
}

// --- Mão de Obra ---
function calcularValorHora() {
    const salario = parseFloat(document.getElementById('salario-receber').value);
    const horas = parseInt(document.getElementById('horas-trabalhadas').value);

    if (isNaN(salario) || isNaN(horas) || horas === 0) {
      document.getElementById('valor-hora').value = '';
      return;
    }

    const valorHora = salario / horas;
    document.getElementById('valor-hora').value = valorHora.toFixed(2);
    return valorHora;
}

function calcularCustoFerias13o() {
    const salario = parseFloat(document.getElementById('salario-receber').value);
    const horas = parseInt(document.getElementById('horas-trabalhadas').value);
    const incluir = document.getElementById('incluir-ferias-13o-sim').checked;

    let custoFerias13o = 0;
    if (incluir) {
        custoFerias13o = ((salario + (salario / 3)) / 12) / horas;
    }
    document.getElementById('custo-ferias-13o').value = custoFerias13o.toFixed(2);
     return custoFerias13o;
}

function salvarMaoDeObra() {
    const valorHora = calcularValorHora();

    if (valorHora === undefined) {
        alert('Preencha os campos de salário e horas corretamente.');
        return;
    }

    maoDeObra.salario = parseFloat(document.getElementById('salario-receber').value);
    maoDeObra.horas = parseInt(document.getElementById('horas-trabalhadas').value);
    maoDeObra.valorHora = valorHora;
    maoDeObra.incluirFerias13o = document.getElementById('incluir-ferias-13o-sim').checked;
    maoDeObra.custoFerias13o = calcularCustoFerias13o();

    document.getElementById('salario-receber').value = maoDeObra.salario;
    document.getElementById('horas-trabalhadas').value = maoDeObra.horas;
    document.getElementById('valor-hora').value = maoDeObra.valorHora.toFixed(2);
    document.getElementById('custo-ferias-13o').value = maoDeObra.custoFerias13o.toFixed(2);

    alert("Dados de mão de obra salvos com sucesso!");
    salvarDadosFirebase();// Salva no Firebase após salvar mão de obra

    modoEdicaoMaoDeObra = true;
    document.getElementById('btn-salvar-mao-de-obra').style.display = 'none';
    document.getElementById('btn-editar-mao-de-obra').style.display = 'inline-block';

    document.getElementById('titulo-mao-de-obra').textContent = 'Informações sobre custo de mão de obra';
    document.getElementById('salario-receber').readOnly = true;
    document.getElementById('horas-trabalhadas').readOnly = true;

     atualizarTabelaCustosIndiretos(); // <---  Atualiza após salvar
     calcularCustos(); // Importante para atualizar a seção de cálculo
}

function editarMaoDeObra() {
    modoEdicaoMaoDeObra = false;

    document.getElementById('salario-receber').readOnly = false;
    document.getElementById('horas-trabalhadas').readOnly = false;

    document.getElementById('btn-editar-mao-de-obra').style.display = 'none';
    document.getElementById('btn-salvar-mao-de-obra').style.display = 'inline-block';

    document.getElementById('mao-de-obra').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('titulo-mao-de-obra').textContent = 'Informações sobre custo de mão de obra';
}

document.getElementById('salario-receber').addEventListener('input', function(){
    calcularValorHora();
    calcularCustoFerias13o();
});
document.getElementById('horas-trabalhadas').addEventListener('input', function(){
    calcularValorHora();
    calcularCustoFerias13o();
    atualizarTabelaCustosIndiretos(); // <--- Atualiza a tabela aqui!
    calcularCustos();  // <-- Importantíssimo! Recalcula após mudar horas
});

// --- Custos Indiretos ---

function carregarCustosIndiretosPredefinidos() {
    const listaCustos = document.getElementById('lista-custos-indiretos');
    listaCustos.innerHTML = '';

    custosIndiretosPredefinidosBase.forEach((custoBase, index) => {
        const listItem = document.createElement('li');
        // Encontra o custo correspondente ou usa o custo base
        const custoAtual = custosIndiretosPredefinidos.find(c => c.descricao === custoBase.descricao) || { ...custoBase };
        listItem.innerHTML = `
            <div class="custo-item-nome">${custoBase.descricao}</div>
            <input type="number" id="custo-indireto-${index}" value="${custoAtual.valorMensal.toFixed(2)}" step="0.01">
            <button onclick="salvarCustoIndiretoPredefinido(${index})">Salvar</button>
        `;
        listaCustos.appendChild(listItem);
    });

    // Custos Adicionais
    custosIndiretosAdicionais.forEach((custo) => {
        const listItem = document.createElement('li');
        listItem.dataset.index = custo.tempIndex; // Importante para identificar na remoção
        listItem.innerHTML = `
            <div class="custo-item-nome">${custo.descricao}</div>
            <input type="number" value="${custo.valorMensal.toFixed(2)}" step="0.01">
            <button onclick="salvarNovoCustoIndiretoLista(this)" data-index="${custo.tempIndex}">Salvar</button>
            <button onclick="removerNovoCustoIndiretoLista(this)" data-index="${custo.tempIndex}">Remover</button>
        `;
        listaCustos.appendChild(listItem);
    });

    atualizarTabelaCustosIndiretos();
}

function salvarCustoIndiretoPredefinido(index) {
    const inputValor = document.getElementById(`custo-indireto-${index}`);
    const novoValor = parseFloat(inputValor.value);
    const descricao = custosIndiretosPredefinidosBase[index].descricao;  //Pega a descrição da base

    if (!isNaN(novoValor)) {
        // Atualiza o custo predefinido, usando a descrição para encontrar o objeto correto
        const custoParaAtualizar = custosIndiretosPredefinidos.find(c => c.descricao === descricao);
        if(custoParaAtualizar){
            custoParaAtualizar.valorMensal = novoValor;
        }
        atualizarTabelaCustosIndiretos();
        calcularCustos(); // <-- Importante! Recalcula após salvar custo indireto
        salvarDadosFirebase();// Salva no Firebase após salvar custo indireto predefinido
    } else {
        alert("Por favor, insira um valor numérico válido.");
    }
}

function adicionarNovoCustoIndireto() {
    const listaCustos = document.getElementById('lista-custos-indiretos');
    const novoIndex = `novoCusto-${novoCustoIndiretoCounter++}`; // ID único

    const listItem = document.createElement('li');
    listItem.dataset.index = novoIndex;  // Armazena o ID
    listItem.innerHTML = `
        <input type="text" class="custo-item-nome" placeholder="Descrição do novo custo">
        <input type="number" value="0.00" step="0.01">
        <button onclick="salvarNovoCustoIndiretoLista(this)" data-index="${novoIndex}">Salvar</button>
        <button onclick="removerNovoCustoIndiretoLista(this)" data-index="${novoIndex}">Remover</button>
    `;
    listaCustos.appendChild(listItem);
}

function salvarNovoCustoIndiretoLista(botao) {
    const listItem = botao.parentNode;
    const descricaoInput = listItem.querySelector('.custo-item-nome');
    const valorInput = listItem.querySelector('input[type="number"]');
    const index = botao.dataset.index; // Recupera o ID

    const descricao = descricaoInput.value.trim();
    const valorMensal = parseFloat(valorInput.value);

    if (descricao && !isNaN(valorMensal)) {
        // Procura se o custo já existe
        const custoExistenteIndex = custosIndiretosAdicionais.findIndex(c => c.tempIndex === index);

        if (custoExistenteIndex !== -1) {
            // Atualiza o custo existente
            custosIndiretosAdicionais[custoExistenteIndex] = { descricao: descricao, valorMensal: valorMensal, tempIndex: index };
        } else {
            // Adiciona o novo custo
            custosIndiretosAdicionais.push({ descricao: descricao, valorMensal: valorMensal, tempIndex: index };
        }
        atualizarTabelaCustosIndiretos(); // Atualiza a tabela
        calcularCustos();  // <-- Importante!
        salvarDadosFirebase();// Salva no Firebase após salvar novo custo indireto

    } else {
        alert("Por favor, preencha a descrição e insira um valor numérico válido.");
    }
}

function removerNovoCustoIndiretoLista(botaoRemover) {
    const listItem = botaoRemover.parentNode;
    const indexToRemove = botaoRemover.dataset.index; // Recupera o ID

    // Filtra o array, removendo o item com o ID correto
    custosIndiretosAdicionais = custosIndiretosAdicionais.filter(custo => custo.tempIndex !== indexToRemove);
    listItem.remove();
    atualizarTabelaCustosIndiretos();
    calcularCustos(); // <-- Importante!
    salvarDadosFirebase();// Salva no Firebase após remover novo custo indireto
}

function atualizarTabelaCustosIndiretos() {
    const tbody = document.querySelector('#tabela-custos-indiretos tbody');
    tbody.innerHTML = '';
    const horasTrabalhadas = maoDeObra.horas;

    if (horasTrabalhadas === undefined || horasTrabalhadas === null || horasTrabalhadas <= 0) {
        const row = tbody.insertRow();
        const cellMensagem = row.insertCell();
        cellMensagem.textContent = "Preencha as 'Horas trabalhadas por mês' no menu 'Custo de Mão de Obra' para calcular o custo por hora.";
        cellMensagem.colSpan = 4;
        return;
    }

    const custosExibicao = [...custosIndiretosPredefinidos, ...custosIndiretosAdicionais].filter(custo => custo.valorMensal > 0);
    const custosFiltrados = custosExibicao.filter(custo => custo.descricao.toLowerCase().includes(termoBusca));

   custosFiltrados.forEach((custo) => {
        const originalIndexPredefinidos = custosIndiretosPredefinidos.findIndex(c => c.descricao === custo.descricao);
        const originalAdicional = custosIndiretosAdicionais.find(c => c.descricao === custo.descricao && c.tempIndex === custo.tempIndex);


        if (custo.valorMensal > 0 || originalAdicional) {
            const row = tbody.insertRow();
            const cellDescricao = row.insertCell();
            const cellValorMensal = row.insertCell();
            const cellValorHoraTrabalhada = row.insertCell();
            const cellAcoes = row.insertCell();

            cellDescricao.textContent = custo.descricao;
            cellValorMensal.textContent = formatarMoeda(custo.valorMensal);

            const valorPorHora = custo.valorMensal / horasTrabalhadas;
            cellValorHoraTrabalhada.textContent = formatarMoeda(valorPorHora);

            // Usa o tipo e o índice/tempIndex corretos
            let botaoAcao;
            if (originalIndexPredefinidos !== -1) {
                botaoAcao = document.createElement('button');
                botaoAcao.textContent = 'Zerar';
                botaoAcao.onclick = function() { zerarCustoIndireto(originalIndexPredefinidos, 'predefinido'); };
            } else if (originalAdicional) {
                botaoAcao = document.createElement('button');
                botaoAcao.textContent = 'Zerar'; // Usa "Zerar" em vez de "Remover"
                botaoAcao.onclick = function() { zerarCustoIndireto(custo.tempIndex, 'adicional'); };
            }

            cellAcoes.appendChild(botaoAcao);

        }
    });
}

// --- Produtos Cadastrados ---
function cadastrarProduto() {
    const nomeProduto = document.getElementById('nome-produto').value;
    const tabelaMateriaisProduto = document.getElementById('tabela-materiais-produto').querySelector('tbody');
    const linhasMateriais = tabelaMateriaisProduto.rows;

    if (!nomeProduto || linhasMateriais.length === 0) {
        alert("Por favor, preencha o nome do produto e adicione pelo menos um material.");
        return;
    }

    let materiaisDoProduto = [];
    let custoTotalMateriaisProduto = 0;

    for (let i = 0; i < linhasMateriais.length; i++) {
        const linha = linhasMateriais[i];
        const nomeMaterial = linha.cells[0].textContent;
        const tipoMaterial = linha.cells[1].textContent.split(' ')[0]; // Pega só a primeira parte (tipo)
        const custoUnitarioMaterial = parseFloat(linha.cells[2].textContent.replace(/[^\d.,-]/g, '').replace('.', '').replace(',', '.'));

        // --- DIMENSOES (agora em sua própria célula) ---
        const larguraInput = linha.cells[3].querySelector('.dimensoes-input.largura');
        const alturaInput = linha.cells[3].querySelector('.dimensoes-input.altura');
        const comprimentoInput = linha.cells[3].querySelector('.dimensoes-input.comprimento'); //Se for comprimento

        const largura = larguraInput ? parseFloat(larguraInput.value) : 0;
        const altura = alturaInput ? parseFloat(alturaInput.value) : 0;
        const comprimento = comprimentoInput? parseFloat(comprimentoInput.value) : 0;


        // --- QUANTIDADE (agora separada das dimensões) ---
        const inputQuantidade = linha.cells[4].querySelector('.quantidade-input');  // Célula 4
        let quantidadeMaterial = quantidadeInput ? parseFloat(quantidadeInput.value) : 0;


        // --- CÁLCULO DO CUSTO TOTAL (CORREÇÃO AQUI) ---
        let custoTotalMaterial = 0;
        if (tipoMaterial === 'Área') {
            const area = (largura * altura) / 10000; // Calcula a área em m²
            custoTotalMaterial = custoUnitarioMaterial * area;
        } else if (tipoMaterial === 'Comprimento') {
            // CONVERTE comprimento de cm para m ANTES de calcular o custo
            const comprimentoEmMetros = comprimento / 100;
            custoTotalMaterial = custoUnitarioMaterial * comprimentoEmMetros; // Usa o comprimento em METROS
        } else {
          custoTotalMaterial = custoUnitarioMaterial * quantidadeMaterial;
        }


        materiaisDoProduto.push({
            nome: nomeMaterial,
            tipo: tipoMaterial,
            custoUnitario: custoUnitarioMaterial,
            largura: largura,      // Valor da largura
            altura: altura,       // Valor da altura
            comprimento: comprimento, //Comprimento *em cm* (para consistência e edição)
            quantidade: quantidadeMaterial, // Valor da QUANTIDADE (separado)
            custoTotal: custoTotalMaterial
        });
        custoTotalMateriaisProduto += custoTotalMaterial;
    }

    const produto = {
        nome: nomeProduto,
        materiais: materiaisDoProduto,
        custoMateriais: custoTotalMateriaisProduto
    };
    produtos.push(produto);

    atualizarTabelaProdutosCadastrados();
    limparFormulario('form-produtos-cadastrados');
    tabelaMateriaisProduto.innerHTML = '';
    salvarDadosFirebase();// Salva no Firebase após cadastrar produto
    alert('Produto cadastrado com sucesso!');
}

function atualizarTabelaProdutosCadastrados() {
    const tbody = document.querySelector('#tabela-produtos tbody');
    tbody.innerHTML = '';

    produtos.forEach((produto, index) => {
        const row = tbody.insertRow();
        const cellNomeProduto = row.insertCell();
        const cellMateriaisUtilizados = row.insertCell();
        const cellCustoTotalMateriais = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNomeProduto.textContent = produto.nome;

        let listaMateriaisHTML = '<ul>';
        produto.materiais.forEach(material => {
            let dimensoesTexto = '';
            if (material.tipo === 'Área') {
                dimensoesTexto = `(${material.largura.toFixed(2)}cm x ${material.altura.toFixed(2)}cm)`;
            } else if (material.tipo === 'Comprimento') {
                dimensoesTexto = `(${material.comprimento.toFixed(2)}cm)`;
            }
            listaMateriaisHTML += `<li>${material.nome} ${dimensoesTexto} - ${formatarMoeda(material.custoTotal)} (Qtd: ${material.quantidade.toFixed(2)})</li>`;
        });
        listaMateriaisHTML += '</ul>';
        cellMateriaisUtilizados.innerHTML = listaMateriaisHTML;
        cellCustoTotalMateriais.textContent = formatarMoeda(produto.custoMateriais);

        const botaoEditarProduto = document.createElement('button');
        botaoEditarProduto.textContent = 'Editar';
        botaoEditarProduto.addEventListener('click', function() {
            editarProduto(index);
        });
        cellAcoes.appendChild(botaoEditarProduto);

        const botaoRemoverProduto = document.createElement('button');
        botaoRemoverProduto.textContent = 'Remover';
        botaoRemoverProduto.addEventListener('click', function() {
            removerProduto(index);
        });
        cellAcoes.appendChild(botaoRemoverProduto);
    });
}

function buscarProdutosCadastrados() {
    const termoBusca = document.getElementById('busca-produto').value.toLowerCase();
    const tbody = document.querySelector('#tabela-produtos tbody');
    tbody.innerHTML = '';

    const produtosFiltrados = produtos.filter(produto => produto.nome.toLowerCase().includes(termoBusca));

    produtosFiltrados.forEach((produto, index) => {
		const row = tbody.insertRow();
        const cellNomeProduto = row.insertCell();
        const cellMateriaisUtilizados = row.insertCell();
        const cellCustoTotalMateriais = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNomeProduto.textContent = produto.nome;

        let listaMateriaisHTML = '<ul>';
        produto.materiais.forEach(material => {
			//Modificação para exibir largura e altura.
            let dimensoesTexto = '';
            if (material.tipo === 'Área') {
                dimensoesTexto = `(${material.largura.toFixed(2)}cm x ${material.altura.toFixed(2)}cm)`;
            }else if (material.tipo === 'Comprimento') {
                dimensoesTexto = `(${material.comprimento.toFixed(2)}cm)`; //Mostra o comprimento
            }
            listaMateriaisHTML += `<li>${material.nome} ${dimensoesTexto} - ${formatarMoeda(material.custoTotal)} (Qtd: ${material.quantidade.toFixed(2)})</li>`;
        });
        listaMateriaisHTML += '</ul>';
        cellMateriaisUtilizados.innerHTML = listaMateriaisHTML;
        cellCustoTotalMateriais.textContent = formatarMoeda(produto.custoMateriais);

        const botaoEditarProduto = document.createElement('button');
        botaoEditarProduto.textContent = 'Editar';
        botaoEditarProduto.addEventListener('click', function() {
            editarProduto(index);
        });
        cellAcoes.appendChild(botaoEditarProduto);

        const botaoRemoverProduto = document.createElement('button');
        botaoRemoverProduto.textContent = 'Remover';
        botaoRemoverProduto.addEventListener('click', function() {
            removerProduto(index);
        });
        cellAcoes.appendChild(botaoRemoverProduto);
    });
}

function adicionarMaterialNaTabelaProduto(material) {
    const tbody = document.querySelector('#tabela-materiais-produto tbody');
    const row = tbody.insertRow();
    const cellNome = row.insertCell();
    const cellTipo = row.insertCell();
    const cellCustoUnitario = row.insertCell();
    const cellDimensoes = row.insertCell();
    const cellQuantidade = row.insertCell();
    const cellCustoTotal = row.insertCell();
    const cellAcoes = row.insertCell();

    cellNome.textContent = material.nome;
    let unidade = '';
    switch (material.tipo) {
        case 'comprimento': unidade = ' (m)'; break;
        case 'litro': unidade = ' (L)'; break;
        case 'quilo': unidade = ' (kg)'; break;
        case 'unidade': unidade = ' (un)'; break;
        case 'area': unidade = ' (m²)'; break;
    }
    cellTipo.textContent = material.tipo.charAt(0).toUpperCase() + material.tipo.slice(1) + unidade;
    cellCustoUnitario.textContent = formatarMoeda(material.custoUnitario);

    // --- Campos de Dimensões (Largura, Altura e Comprimento) ---
    // MODIFICAÇÃO AQUI: Adiciona a unidade de medida ao placeholder
    let larguraInput, alturaInput, comprimentoInput;

    if (material.tipo === 'area') {
        larguraInput = document.createElement('input');
        larguraInput.type = 'number';
        larguraInput.placeholder = 'Largura (cm)'; // Adiciona (cm)
        larguraInput.min = 0.01;
        larguraInput.step = 0.01;
        larguraInput.classList.add('dimensoes-input', 'largura');
        larguraInput.value = material.largura || '';

        alturaInput = document.createElement('input');
        alturaInput.type = 'number';
        alturaInput.placeholder = 'Altura (cm)'; // Adiciona (cm)
        alturaInput.min = 0.01;
        alturaInput.step = 0.01;
        alturaInput.classList.add('dimensoes-input', 'altura');
        alturaInput.value = material.altura || '';

        cellDimensoes.appendChild(larguraInput);
        cellDimensoes.appendChild(alturaInput);

    } else if (material.tipo === 'comprimento') {
        comprimentoInput = document.createElement('input');
        comprimentoInput.type = 'number';
        comprimentoInput.placeholder = 'Comprimento (cm)'; // Adiciona (cm)
        comprimentoInput.min = 0.01;
        comprimentoInput.step = 0.01;
        comprimentoInput.classList.add('dimensoes-input', 'comprimento');
        comprimentoInput.value = material.comprimento || '';
        cellDimensoes.appendChild(comprimentoInput);
    }
    // --- Campo de Quantidade (AGORA SEPARADO) ---
    const inputQuantidade = document.createElement('input');
    inputQuantidade.type = 'number';
    inputQuantidade.value = material.quantidade || 1;
    inputQuantidade.min = 0.01;
    inputQuantidade.step = 0.01;
    inputQuantidade.classList.add('quantidade-input');
    inputQuantidade.readOnly = material.tipo === 'area';


    const unidadeMedidaSpan = document.createElement('span');
    unidadeMedidaSpan.classList.add('unidade-medida');
    // --- Lógica para Área (agora calcula e exibe a área corretamente) ---
    if (material.tipo === 'area') {
        const areaSpan = document.createElement('span');
        areaSpan.classList.add('dimensoes-span');
        cellDimensoes.appendChild(areaSpan);
        unidadeMedidaSpan.textContent = '';

        // Função para calcular a área e atualizar o custo total
        function calcularAreaEAtualizar() {
            const largura = parseFloat(larguraInput.value) || 0;
            const altura = parseFloat(alturaInput.value) || 0;

            if (isNaN(largura) || largura <= 0 || isNaN(altura) || altura <= 0) {
                areaSpan.textContent = '0.00 m²';
                inputQuantidade.value = 0;
                calcularCustoTotalMaterial();
                return;
            }

            const area = (largura * altura) / 10000;
            areaSpan.textContent = area.toFixed(2) + ' m²';
            inputQuantidade.value = area.toFixed(2);
            calcularCustoTotalMaterial();
        }

        larguraInput.addEventListener('input', calcularAreaEAtualizar);
        alturaInput.addEventListener('input', calcularAreaEAtualizar);

        calcularAreaEAtualizar();

    } else if(material.tipo === 'comprimento'){
        const comprimentoSpan = document.createElement('span');
        comprimentoSpan.classList.add('dimensoes-span');
        cellDimensoes.appendChild(comprimentoSpan);
        unidadeMedidaSpan.textContent = '';

        function calcularComprimentoEAtualizar(){
            const comprimento = parseFloat(comprimentoInput.value) || 0;

            if(isNaN(comprimento) || comprimento <= 0){
                comprimentoSpan.textContent = '0.00 cm';
                inputQuantidade.value = 0;
                calcularCustoTotalMaterial();
                return;
            }

            comprimentoSpan.textContent = comprimento.toFixed(2) + ' cm';
            inputQuantidade.value = comprimento.toFixed(2);
            calcularCustoTotalMaterial();
        }
        comprimentoInput.addEventListener('input', calcularComprimentoEAtualizar);
        calcularComprimentoEAtualizar();

    }else {
        unidadeMedidaSpan.textContent = unidade;
        inputQuantidade.addEventListener('input', calcularCustoTotalMaterial);
    }

    cellQuantidade.appendChild(inputQuantidade);
    cellQuantidade.appendChild(unidadeMedidaSpan);


    // --- Função para calcular o custo total ---
    function calcularCustoTotalMaterial() {
        let quantidade = parseFloat(inputQuantidade.value);
         if (isNaN(quantidade) || quantidade <= 0) {
            if(material.tipo !== 'area' && material.tipo !== 'comprimento'){
                quantidade = 0.01;
                inputQuantidade.value = quantidade;
            } else{
                quantidade = 0;
            }
        }

        let custoTotal = 0;
        if(material.tipo === "area"){
            const largura = parseFloat(larguraInput.value) || 0;
            const altura = parseFloat(alturaInput.value) || 0;
            const area = (largura * altura) / 10000;
            custoTotal = material.custoUnitario * area;

        } else if(material.tipo === "comprimento") {
            const comprimento = parseFloat(comprimentoInput.value) || 0;
            const comprimentoEmMetros = comprimento / 100;
            custoTotal = material.custoUnitario * comprimentoEmMetros;

        } else {
          custoTotal = material.custoUnitario * quantidade;
        }

        cellCustoTotal.textContent = formatarMoeda(custoTotal);
    }

    calcularCustoTotalMaterial();


    const botaoRemoverMaterial = document.createElement('button');
    botaoRemoverMaterial.textContent = 'Remover';
    botaoRemoverMaterial.addEventListener('click', function() {
        removerLinhaMaterial(row);
    });
    cellAcoes.appendChild(botaoRemoverMaterial);
}

function editarProduto(index) {
    const produto = produtos[index];
    if (!produto) return;

    document.getElementById('nome-produto').value = produto.nome;

    const tabelaMateriaisProdutoBody = document.querySelector('#tabela-materiais-produto tbody');
    tabelaMateriaisProdutoBody.innerHTML = '';

    produto.materiais.forEach(material => {
        adicionarMaterialNaTabelaProduto(material);
    });

    produtos.splice(index, 1);
    atualizarTabelaProdutosCadastrados();
    salvarDadosFirebase();// Salva no Firebase após editar produto
    document.getElementById('produtos-cadastrados').scrollIntoView({ behavior: 'smooth' });
    document.querySelector('#produtos-cadastrados h2').textContent = 'Editar Produto';
}

function removerProduto(index) {
    produtos.splice(index, 1);
    atualizarTabelaProdutosCadastrados();
    salvarDadosFirebase();// Salva no Firebase após remover produto
}

// --- Pesquisa e Adição de Materiais na Seção Produtos ---
document.getElementById('pesquisa-material').addEventListener('input', function() {
    const termoPesquisa = this.value.toLowerCase();
    const resultadosPesquisaDiv = document.getElementById('resultados-pesquisa');
    resultadosPesquisaDiv.innerHTML = '';

    if (termoPesquisa.length < 2) {
        resultadosPesquisaDiv.style.display = 'none';
        return;
    }

    const materiaisFiltrados = materiais.filter(material => material.nome.toLowerCase().includes(termoPesquisa));

    if (materiaisFiltrados.length > 0) {
        resultadosPesquisaDiv.style.display = 'block';
        materiaisFiltrados.forEach(material => {
            const resultadoDiv = document.createElement('div');
            resultadoDiv.textContent = material.nome + ' (' + material.tipo + ') - Custo Unitário: ' + formatarMoeda(material.custoUnitario);
            resultadoDiv.addEventListener('click', function() {
                adicionarMaterialNaTabelaProduto(material);
                document.getElementById('pesquisa-material').value = '';
                resultadosPesquisaDiv.innerHTML = '';
                resultadosPesquisaDiv.style.display = 'none';
                salvarDadosFirebase();// Salva no Firebase após adicionar material na tabela de produtos
            });
            resultadosPesquisaDiv.appendChild(resultadoDiv);
        });
    } else {
        resultadosPesquisaDiv.style.display = 'none';
    }
});

function removerLinhaMaterial(row) {
    row.remove();
     salvarDadosFirebase();// Salva no Firebase após remover linha de material
}

// --- Cálculo da Precificação (Refatorado) ---

function buscarProdutosAutocomplete() {
    const termo = document.getElementById('produto-pesquisa').value.toLowerCase();
    const resultadosDiv = document.getElementById('produto-resultados');
    resultadosDiv.innerHTML = ''; // Limpa resultados anteriores
    resultadosDiv.classList.remove('hidden'); //Mostra a div

    if (termo.length < 2) {
        resultadosDiv.classList.add('hidden'); //Esconde se termo muito curto.
        return; // Sai se o termo for muito curto
    }

    const produtosFiltrados = produtos.filter(produto => produto.nome.toLowerCase().includes(termo));

    if (produtosFiltrados.length > 0) {
        produtosFiltrados.forEach(produto => {
            const div = document.createElement('div');
            div.textContent = produto.nome;
            div.addEventListener('click', function() {
                selecionarProduto(produto.nome); // Função para selecionar
                resultadosDiv.classList.add('hidden'); // Esconde após seleção
            });
            resultadosDiv.appendChild(div);
        });
    } else {
       resultadosDiv.classList.add('hidden'); //Esconde caso não encontre.
    }
}

function selecionarProduto(nomeProduto) {
    document.getElementById('produto-pesquisa').value = nomeProduto; // Preenche o campo
    carregarDadosProduto(nomeProduto); // Carrega os dados (custo)
}

function carregarDadosProduto(nomeProduto) {
    const produto = produtos.find(p => p.nome === nomeProduto);

    if (produto) {
        document.getElementById('custo-produto').textContent = formatarMoeda(produto.custoMateriais);
        // Exibe os detalhes do produto (materiais)
        const detalhesProdutoDiv = document.getElementById('detalhes-produto');
        const listaMateriais = document.getElementById('lista-materiais-produto');
        listaMateriais.innerHTML = ''; // Limpa a lista

        produto.materiais.forEach(material => {
            //Modificação para exibir largura e altura
			let dimensoesTexto = '';
            if (material.tipo === 'Área') {
                dimensoesTexto = `(${material.largura.toFixed(2)}cm x ${material.altura.toFixed(2)}cm)`;
            }else if (material.tipo === 'Comprimento') {
                dimensoesTexto = `(${material.comprimento.toFixed(2)}cm)`; //Mostra o comprimento
            }
            const li = document.createElement('li');
            li.textContent = `${material.nome} ${dimensoesTexto} (${material.tipo}) - Qtd: ${material.quantidade.toFixed(2)} - Custo: ${formatarMoeda(material.custoTotal)}`;  //Quantidade com 2 casas
            listaMateriais.appendChild(li);
        });
        detalhesProdutoDiv.style.display = 'block'; // Mostra a div

        calcularCustos(); // Recalcula *tudo*
    } else {
        document.getElementById('custo-produto').textContent = 'R$ 0,00';
         document.getElementById('detalhes-produto').style.display = 'none'; // Esconde se não tiver produto
    }
}

function calcularCustos() {
    const horasProduto = parseFloat(document.getElementById('horas-produto').value) || 0;

    // 1. Custo de Mão de Obra (DETALHADO)
    const custoMaoDeObra = maoDeObra.valorHora * horasProduto;
    const custoFerias13o = maoDeObra.custoFerias13o * horasProduto;
    const totalMaoDeObra = custoMaoDeObra + custoFerias13o;

    document.getElementById('custo-mao-de-obra-detalhe').textContent = formatarMoeda(custoMaoDeObra);
    document.getElementById('custo-ferias-13o-detalhe').textContent = formatarMoeda(custoFerias13o);
    document.getElementById('total-mao-de-obra').textContent = formatarMoeda(totalMaoDeObra);


    // 2. Custo do Produto (já é carregado em carregarDadosProduto)

    // 3. Custos Indiretos (DETALHADO, por item, e SÓ SE > 0)
    let custoIndiretoTotalProduto = 0;
    const listaCustosIndiretosDetalhes = document.getElementById('lista-custos-indiretos-detalhes');
    listaCustosIndiretosDetalhes.innerHTML = ''; // Limpa a lista

    custosIndiretosPredefinidos.forEach(custo => {
        const custoPorHora = custo.valorMensal / maoDeObra.horas;
        const custoItemProduto = custoPorHora * horasProduto;

        // AQUI: Só adiciona à lista se o custo for > 0
        if (custoItemProduto > 0) {
            custoIndiretoTotalProduto += custoItemProduto;
            const li = document.createElement('li');
            li.textContent = `${custo.descricao}: ${formatarMoeda(custoItemProduto)}`;
            listaCustosIndiretosDetalhes.appendChild(li);
        }
    });

    custosIndiretosAdicionais.forEach(custo => {
        const custoPorHora = custo.valorMensal / maoDeObra.horas;
        const custoItemProduto = custoPorHora * horasProduto;

        // AQUI: Só adiciona à lista se o custo for > 0
        if (custoItemProduto > 0) {
            custoIndiretoTotalProduto += custoItemProduto;
            const li = document.createElement('li');
            li.textContent = `${custo.descricao}: ${formatarMoeda(custoItemProduto)}`;
            listaCustosIndiretosDetalhes.appendChild(li);
        }
    });

     document.getElementById('custo-indireto').textContent = formatarMoeda(custoIndiretoTotalProduto); // Total (por hora)

    // 4. Subtotal
    const nomeProduto = document.getElementById('produto-pesquisa').value;
    const produto = produtos.find(p => p.nome === nomeProduto);
    const custoProduto = produto ? produto.custoMateriais : 0;
    const subtotal = custoProduto + totalMaoDeObra + custoIndiretoTotalProduto;
    document.getElementById('subtotal').textContent = formatarMoeda(subtotal);

    calcularPrecoVendaFinal(); //Chama para já calcular com os novos valores.
}

function calcularPrecoVendaFinal(){
   const margemLucro = parseFloat(document.getElementById('margem-lucro-final').value) / 100 || 0;
    const subtotalTexto = document.getElementById('subtotal').textContent;

    // Converte o subtotal para um número, tratando a formatação de moeda
    const subtotalNumerico = parseFloat(subtotalTexto.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.')) || 0;
    const precoVenda = subtotalNumerico * (1 + margemLucro);
     const margemLucroValor = precoVenda - subtotalNumerico; //Calcula a margem
    document.getElementById('margem-lucro-valor').textContent = formatarMoeda(margemLucroValor);
    document.getElementById('total-final').textContent = formatarMoeda(precoVenda);

    calcularTotalComTaxas(); //Chama a função para o cálculo final.
}

// --- Função para Taxa de Crédito ---
function salvarTaxaCredito() {
    const incluir = document.getElementById('incluir-taxa-credito-sim').checked;
    const percentual = parseFloat(document.getElementById('taxa-credito-percentual').value);

    if (incluir && (isNaN(percentual) || percentual < 0)) {
        alert("Por favor, insira um valor percentual válido para a taxa.");
        return;
    }

    taxaCredito.incluir = incluir;
    taxaCredito.percentual = incluir ? percentual : 0; //Salva 0 se não incluir.
    calcularTotalComTaxas(); //Recalcula o total com a nova taxa.
    salvarDadosFirebase();// Salva no Firebase após salvar taxa de crédito
}

function calcularTotalComTaxas() {
    const precoVendaTexto = document.getElementById('total-final').textContent; //Pega do total com margem.
    const precoVendaNumerico = parseFloat(precoVendaTexto.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.')) || 0;

    let taxaCreditoValor = 0;
    if (taxaCredito.incluir) {
        taxaCreditoValor = precoVendaNumerico * (taxaCredito.percentual / 100);
    }
    document.getElementById('taxa-credito-valor').textContent = formatarMoeda(taxaCreditoValor);

    const totalFinalComTaxas = precoVendaNumerico + taxaCreditoValor;
    document.getElementById('total-final-com-taxas').textContent = formatarMoeda(totalFinalComTaxas);
}

// Event Listeners (ajustado)
document.addEventListener('DOMContentLoaded', () => {

    // Não precisa mais carregar produtos em um <select>

    // Evento para o autocomplete
    document.getElementById('produto-pesquisa').addEventListener('input', buscarProdutosAutocomplete);

    // Eventos para cálculo
    document.getElementById('horas-produto').addEventListener('input', calcularCustos);
     document.getElementById('margem-lucro-final').addEventListener('input', calcularPrecoVendaFinal);

     //Eventos para a taxa
     document.getElementById('incluir-taxa-credito-sim').addEventListener('change', salvarTaxaCredito);
      document.getElementById('incluir-taxa-credito-nao').addEventListener('change', salvarTaxaCredito);
     document.getElementById('taxa-credito-percentual').addEventListener('input', salvarTaxaCredito);
});

//Para esconder o autocomplete quando clica fora.
document.addEventListener('click', function(event) {
    const autocompleteDiv = document.getElementById('produto-resultados');
    const inputPesquisa = document.getElementById('produto-pesquisa');

    if (event.target !== autocompleteDiv && event.target !== inputPesquisa) {
        autocompleteDiv.classList.add('hidden');
    }
});
```

**`precificacao.js`:**

```javascript
/* Variáveis globais */
let materiais = [];
let maoDeObra = { salario: 0, horas: 220, valorHora: 0, incluirFerias13o: false, custoFerias13o: 0 }; // Horas padrão 220h
let custosIndiretosPredefinidosBase = [ // This is the base template, never modified
    { descricao: "Energia elétrica", valorMensal: 0 },
    { descricao: "Água", valorMensal: 0 },
    { descricao: "Gás", valorMensal: 0 },
    { descricao: "Aluguel do espaço", valorMensal: 0 },
    { descricao: "Depreciação de máquinas e equipamentos", valorMensal: 0 },
    { descricao: "Manutenção predial e de equipamentos", valorMensal: 0 },
    { descricao: "Despesas com segurança", valorMensal: 0 },
    { descricao: "Limpeza e conservação", valorMensal: 0 },
    { descricao: "Material de escritório", valorMensal: 0 },
    { descricao: "Impostos e taxas indiretos", valorMensal: 0 },
    { descricao: "Marketing institucional", valorMensal: 0 },
    { descricao: "Transporte e logística", valorMensal: 0 },
    { descricao: "Despesas com utilidades", valorMensal: 0 },
    { descricao: "Demais custos administrativos", valorMensal: 0 }
];
let custosIndiretosPredefinidos = JSON.parse(JSON.stringify(custosIndiretosPredefinidosBase)); // Working copy, modified by user inputs
let custosIndiretosAdicionais = [];
let produtos = [];
let modoEdicaoMaoDeObra = false;
let itemEdicaoCustoIndireto = null;
let novoCustoIndiretoCounter = 0; // Contador para IDs únicos de custos indiretos adicionais
let taxaCredito = {percentual: 6, incluir: false}; //Objeto para taxa de crédito


/* Formatação de valores em moeda */
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* Exibir a subpágina desejada */
function mostrarSubMenu(submenuId) {
    const conteudos = ['materiais-insumos', 'mao-de-obra', 'custos-indiretos', 'produtos-cadastrados', 'calculo-precificacao'];
    conteudos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = 'none';
        }
    });
    const submenu = document.getElementById(submenuId);
    if (submenu) {
        submenu.style.display = 'block';
    }
}

/* Limpar formulário */
function limparFormulario(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

/* Monitorar os radios para exibir os campos corretos */
document.querySelectorAll('input[name="tipo-material"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const camposComprimento = document.getElementById('campos-comprimento');
        const camposLitro = document.getElementById('campos-litro');
        const camposQuilo = document.getElementById('campos-quilo');
        const camposArea = document.getElementById('campos-area');

        camposComprimento.style.display = 'none';
        camposLitro.style.display = 'none';
        camposQuilo.style.display = 'none';
        camposArea.style.display = 'none';

        if (this.value === "comprimento") {
            camposComprimento.style.display = "block";
        } else if (this.value === "litro") {
            camposLitro.style.display = "block";
        } else if (this.value === "quilo") {
            camposQuilo.style.display = "block";
        } else if (this.value === "area") {
            camposArea.style.display = "block";
        }
    });
});

/* Função para calcular o custo unitário com base nas fórmulas */
function calcularCustoUnitario(tipo, valorTotal, comprimentoCm, volumeMl, pesoG, larguraCm, alturaCm) {
    let custoUnitario = 0;
    switch (tipo) {
        case "comprimento":
            custoUnitario = valorTotal / (comprimentoCm / 100);  // Divide por 100 para converter cm para m
            break;
        case "litro":
            custoUnitario = valorTotal / (volumeMl / 1000); // Divide por 1000 para converter ml para L
            break;
        case "quilo":
            custoUnitario = valorTotal / (pesoG / 1000);  // Divide por 1000 para converter g para kg
            break;
        case "unidade":
            custoUnitario = valorTotal;
            break;
        case "area":
            // A área já é calculada em m² em cadastrarMaterialInsumo
            custoUnitario = valorTotal / ((larguraCm/100) * (alturaCm/100)); // Divide o valor total pela área em m²
            break;
    }
    return custoUnitario;
}

/* Cadastrar Material/Insumo */
function cadastrarMaterialInsumo() {
    const nome = document.getElementById('nome-material').value.trim();
    const valorTotal = parseFloat(document.getElementById('valor-total-material').value);
    const tipo = document.querySelector('input[name="tipo-material"]:checked').value;
    let comprimentoCm = 0, volumeMl = 0, pesoG = 0, larguraCm = 0, alturaCm = 0;

    // --- Validação de entrada (mantido) ---
    if (!nome) {
        alert("Por favor, insira um nome para o material.");
        return;
    }
    if (isNaN(valorTotal) || valorTotal <= 0) {
        alert("Por favor, insira um valor total válido (maior que zero).");
        return;
    }

    // --- Coleta e validação de dimensões (mantido) ---
    if (tipo === 'comprimento') {
        comprimentoCm = parseFloat(document.getElementById('comprimento-cm').value);
        if (isNaN(comprimentoCm) || comprimentoCm <= 0) {
            alert("Por favor, insira um comprimento válido (maior que zero).");
            return;
        }
    } else if (tipo === 'litro') {
        volumeMl = parseFloat(document.getElementById('volume-ml').value);
        if (isNaN(volumeMl) || volumeMl <= 0) {
            alert("Por favor, insira um volume válido (maior que zero).");
            return;
        }
    } else if (tipo === 'quilo') {
        pesoG = parseFloat(document.getElementById('peso-g').value);
        if (isNaN(pesoG) || pesoG <= 0) {
            alert("Por favor, insira um peso válido (maior que zero).");
            return;
        }
    } else if (tipo === 'area') {
        larguraCm = parseFloat(document.getElementById('largura-cm').value);
        alturaCm = parseFloat(document.getElementById('altura-cm').value);
        if (isNaN(larguraCm) || larguraCm <= 0 || isNaN(alturaCm) || alturaCm <= 0) {
            alert("Por favor, insira dimensões válidas para a área (maiores que zero).");
            return;
        }
    }

    // --- Cálculo do Custo Unitário (mantido) ---
    const custoUnitario = calcularCustoUnitario(tipo, valorTotal, comprimentoCm, volumeMl, pesoG, larguraCm, alturaCm);

    // --- Criação do objeto do material (mantido) ---
    const item = {
        nome,
        tipo,
        custoUnitario,
        comprimentoCm,
        volumeMl,
        pesoG,
        larguraCm,
        alturaCm
    };

    // 1. Adiciona o item ao array de materiais.
    materiais.push(item);

    // 2. Atualiza a tabela *ANTES* de resetar o formulário.
    atualizarTabelaMateriaisInsumos();

    // 3. Salva os dados no Firebase (incluindo os materiais)
    salvarDadosFirebase();

    // 4. Limpa *todos* os campos do formulário.
    limparFormulario('form-materiais-insumos');

    // 5. Reseta o título do formulário.
    document.getElementById('titulo-materiais-insumos').textContent = "Cadastro de Materiais e Insumos";

    // 6. Seleciona o radio button "Comprimento" *e* dispara o evento 'change'.
    const radioComprimento = document.querySelector('input[name="tipo-material"][value="comprimento"]');
    radioComprimento.checked = true;
    radioComprimento.dispatchEvent(new Event('change')); // <-- Importante!

    // 7. Garante que o placeholder do comprimento esteja correto (cm).
    document.getElementById('comprimento-cm').placeholder = "Comprimento (cm)";

}

/* Atualizar a tabela de Materiais e Insumos */
function atualizarTabelaMateriaisInsumos() {
    const tbody = document.querySelector('#tabela-materiais-insumos tbody');
    tbody.innerHTML = '';
    materiais.forEach((item, index) => {
        const row = tbody.insertRow();
        const cellNome = row.insertCell();
        const cellTipo = row.insertCell();
        const cellCustoUnit = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNome.textContent = item.nome;
        cellTipo.textContent =
            (item.tipo === 'comprimento' ? 'Comprimento (Metro)' :
                item.tipo === 'litro' ? 'Litro' :
                    item.tipo === 'quilo' ? 'Quilo' :
                        item.tipo === 'area' ? 'Área (m²)' : 'Unidade');
        cellCustoUnit.textContent = formatarMoeda(item.custoUnitario);

        // Botão Editar
        const botaoEditar = document.createElement('button');
        botaoEditar.textContent = 'Editar';
        botaoEditar.addEventListener('click', function() {
            editarMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoEditar);

        // Botão Remover
        const botaoRemover = document.createElement('button');
        botaoRemover.textContent = 'Remover';
        botaoRemover.addEventListener('click', function() {
            removerMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoRemover);
    });
}

// Função para buscar materiais cadastrados
function buscarMateriaisCadastrados() {
    const termoBusca = document.getElementById('busca-material').value.toLowerCase();
    const tbody = document.querySelector('#tabela-materiais-insumos tbody');
    tbody.innerHTML = '';

    const materiaisFiltrados = materiais.filter(item => item.nome.toLowerCase().includes(termoBusca));

    materiaisFiltrados.forEach((item, index) => {
        const row = tbody.insertRow();
        const cellNome = row.insertCell();
        const cellTipo = row.insertCell();
        const cellCustoUnit = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNome.textContent = item.nome;
        cellTipo.textContent = item.tipo;
        cellCustoUnit.textContent = formatarMoeda(item.custoUnitario);

        // Botão Editar
        const botaoEditar = document.createElement('button');
        botaoEditar.textContent = 'Editar';
        botaoEditar.addEventListener('click', function() {
            editarMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoEditar);

        // Botão Remover
        const botaoRemover = document.createElement('button');
        botaoRemover.textContent = 'Remover';
        botaoRemover.addEventListener('click', function() {
            removerMaterialInsumo(index);
        });
        cellAcoes.appendChild(botaoRemover);
    });
}

function editarMaterialInsumo(index) {
    const item = materiais[index];

    // --- Preenche os campos do formulário ---
    document.getElementById('nome-material').value = item.nome;
    document.getElementById('valor-total-material').value = item.tipo === 'area' ? item.custoUnitario * ((item.larguraCm/100) * (item.alturaCm/100)) : item.custoUnitario;  //Mantem o valor total.

    // Seleciona o radio button correto *e* dispara o evento 'change'
    const radio = document.querySelector(`input[name="tipo-material"][value="${item.tipo}"]`);
    radio.checked = true;
    radio.dispatchEvent(new Event('change')); //  <-- Importante!

    // Preenche os campos de dimensão (se existirem)
    if (item.tipo === 'comprimento') {
        document.getElementById('comprimento-cm').value = item.comprimentoCm;
    } else if (item.tipo === 'litro') {
        document.getElementById('volume-ml').value = item.volumeMl;
    } else if (item.tipo === 'quilo') {
        document.getElementById('peso-g').value = item.pesoG;
    } else if (item.tipo === 'area') {
        document.getElementById('largura-cm').value = item.larguraCm;
        document.getElementById('altura-cm').value = item.alturaCm;
    }

    // --- Remove o item original (vai ser readicionado no final do cadastro) ---
    materiais.splice(index, 1);
    atualizarTabelaMateriaisInsumos();

    // --- Scroll e foco ---
    document.getElementById('materiais-insumos').scrollIntoView({ behavior: 'smooth' });
     document.getElementById('titulo-materiais-insumos').textContent = 'Editar Material/Insumo';
}

function removerMaterialInsumo(index) {
    materiais.splice(index, 1);
    atualizarTabelaMateriaisInsumos();
    salvarDadosFirebase(); // Salva no Firebase após remover material
}

// --- Mão de Obra ---
function calcularValorHora() {
    const salario = parseFloat(document.getElementById('salario-receber').value);
    const horas = parseInt(document.getElementById('horas-trabalhadas').value);

    if (isNaN(salario) || isNaN(horas) || horas === 0) {
      document.getElementById('valor-hora').value = '';
      return;
    }

    const valorHora = salario / horas;
    document.getElementById('valor-hora').value = valorHora.toFixed(2);
    return valorHora;
}

function calcularCustoFerias13o() {
    const salario = parseFloat(document.getElementById('salario-receber').value);
    const horas = parseInt(document.getElementById('horas-trabalhadas').value);
    const incluir = document.getElementById('incluir-ferias-13o-sim').checked;

    let custoFerias13o = 0;
    if (incluir) {
        custoFerias13o = ((salario + (salario / 3)) / 12) / horas;
    }
    document.getElementById('custo-ferias-13o').value = custoFerias13o.toFixed(2);
     return custoFerias13o;
}

function salvarMaoDeObra() {
    const valorHora = calcularValorHora();

    if (valorHora === undefined) {
        alert('Preencha os campos de salário e horas corretamente.');
        return;
    }

    maoDeObra.salario = parseFloat(document.getElementById('salario-receber').value);
    maoDeObra.horas = parseInt(document.getElementById('horas-trabalhadas').value);
    maoDeObra.valorHora = valorHora;
    maoDeObra.incluirFerias13o = document.getElementById('incluir-ferias-13o-sim').checked;
    maoDeObra.custoFerias13o = calcularCustoFerias13o();

    document.getElementById('salario-receber').value = maoDeObra.salario;
    document.getElementById('horas-trabalhadas').value = maoDeObra.horas;
    document.getElementById('valor-hora').value = maoDeObra.valorHora.toFixed(2);
    document.getElementById('custo-ferias-13o').value = maoDeObra.custoFerias13o.toFixed(2);

    alert("Dados de mão de obra salvos com sucesso!");
    salvarDadosFirebase();// Salva no Firebase após salvar mão de obra

    modoEdicaoMaoDeObra = true;
    document.getElementById('btn-salvar-mao-de-obra').style.display = 'none';
    document.getElementById('btn-editar-mao-de-obra').style.display = 'inline-block';

    document.getElementById('titulo-mao-de-obra').textContent = 'Informações sobre custo de mão de obra';
    document.getElementById('salario-receber').readOnly = true;
    document.getElementById('horas-trabalhadas').readOnly = true;

     atualizarTabelaCustosIndiretos(); // <---  Atualiza após salvar
     calcularCustos(); // Importante para atualizar a seção de cálculo
}

function editarMaoDeObra() {
    modoEdicaoMaoDeObra = false;

    document.getElementById('salario-receber').readOnly = false;
    document.getElementById('horas-trabalhadas').readOnly = false;

    document.getElementById('btn-editar-mao-de-obra').style.display = 'none';
    document.getElementById('btn-salvar-mao-de-obra').style.display = 'inline-block';

    document.getElementById('mao-de-obra').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('titulo-mao-de-obra').textContent = 'Informações sobre custo de mão de obra';
}

document.getElementById('salario-receber').addEventListener('input', function(){
    calcularValorHora();
    calcularCustoFerias13o();
});
document.getElementById('horas-trabalhadas').addEventListener('input', function(){
    calcularValorHora();
    calcularCustoFerias13o();
    atualizarTabelaCustosIndiretos(); // <--- Atualiza a tabela aqui!
    calcularCustos();  // <-- Importantíssimo! Recalcula após mudar horas
});

// --- Custos Indiretos ---

function carregarCustosIndiretosPredefinidos() {
    const listaCustos = document.getElementById('lista-custos-indiretos');
    listaCustos.innerHTML = '';

    custosIndiretosPredefinidosBase.forEach((custoBase, index) => {
        const listItem = document.createElement('li');
        // Encontra o custo correspondente ou usa o custo base
        const custoAtual = custosIndiretosPredefinidos.find(c => c.descricao === custoBase.descricao) || { ...custoBase };
        listItem.innerHTML = `
            <div class="custo-item-nome">${custoBase.descricao}</div>
            <input type="number" id="custo-indireto-${index}" value="${custoAtual.valorMensal.toFixed(2)}" step="0.01">
            <button onclick="salvarCustoIndiretoPredefinido(${index})">Salvar</button>
        `;
        listaCustos.appendChild(listItem);
    });

    // Custos Adicionais
    custosIndiretosAdicionais.forEach((custo) => {
        const listItem = document.createElement('li');
        listItem.dataset.index = custo.tempIndex; // Importante para identificar na remoção
        listItem.innerHTML = `
            <div class="custo-item-nome">${custo.descricao}</div>
            <input type="number" value="${custo.valorMensal.toFixed(2)}" step="0.01">
            <button onclick="salvarNovoCustoIndiretoLista(this)" data-index="${custo.tempIndex}">Salvar</button>
            <button onclick="removerNovoCustoIndiretoLista(this)" data-index="${custo.tempIndex}">Remover</button>
        `;
        listaCustos.appendChild(listItem);
    });

    atualizarTabelaCustosIndiretos();
}

function salvarCustoIndiretoPredefinido(index) {
    const inputValor = document.getElementById(`custo-indireto-${index}`);
    const novoValor = parseFloat(inputValor.value);
    const descricao = custosIndiretosPredefinidosBase[index].descricao;  //Pega a descrição da base

    if (!isNaN(novoValor)) {
        // Atualiza o custo predefinido, usando a descrição para encontrar o objeto correto
        const custoParaAtualizar = custosIndiretosPredefinidos.find(c => c.descricao === descricao);
        if(custoParaAtualizar){
            custoParaAtualizar.valorMensal = novoValor;
        }
        atualizarTabelaCustosIndiretos();
        calcularCustos(); // <-- Importante! Recalcula após salvar custo indireto
        salvarDadosFirebase();// Salva no Firebase após salvar custo indireto predefinido
    } else {
        alert("Por favor, insira um valor numérico válido.");
    }
}

function adicionarNovoCustoIndireto() {
    const listaCustos = document.getElementById('lista-custos-indiretos');
    const novoIndex = `novoCusto-${novoCustoIndiretoCounter++}`; // ID único

    const listItem = document.createElement('li');
    listItem.dataset.index = novoIndex;  // Armazena o ID
    listItem.innerHTML = `
        <input type="text" class="custo-item-nome" placeholder="Descrição do novo custo">
        <input type="number" value="0.00" step="0.01">
        <button onclick="salvarNovoCustoIndiretoLista(this)" data-index="${novoIndex}">Salvar</button>
        <button onclick="removerNovoCustoIndiretoLista(this)" data-index="${novoIndex}">Remover</button>
    `;
    listaCustos.appendChild(listItem);
}

function salvarNovoCustoIndiretoLista(botao) {
    const listItem = botao.parentNode;
    const descricaoInput = listItem.querySelector('.custo-item-nome');
    const valorInput = listItem.querySelector('input[type="number"]');
    const index = botao.dataset.index; // Recupera o ID

    const descricao = descricaoInput.value.trim();
    const valorMensal = parseFloat(valorInput.value);

    if (descricao && !isNaN(valorMensal)) {
        // Procura se o custo já existe
        const custoExistenteIndex = custosIndiretosAdicionais.findIndex(c => c.tempIndex === index);

        if (custoExistenteIndex !== -1) {
            // Atualiza o custo existente
            custosIndiretosAdicionais[custoExistenteIndex] = { descricao: descricao, valorMensal: valorMensal, tempIndex: index };
        } else {
            // Adiciona o novo custo
            custosIndiretosAdicionais.push({ descricao: descricao, valorMensal: valorMensal, tempIndex: index };
        }
        atualizarTabelaCustosIndiretos(); // Atualiza a tabela
        calcularCustos();  // <-- Importante!
        salvarDadosFirebase();// Salva no Firebase após salvar novo custo indireto

    } else {
        alert("Por favor, preencha a descrição e insira um valor numérico válido.");
    }
}

function removerNovoCustoIndiretoLista(botaoRemover) {
    const listItem = botaoRemover.parentNode;
    const indexToRemove = botaoRemover.dataset.index; // Recupera o ID

    // Filtra o array, removendo o item com o ID correto
    custosIndiretosAdicionais = custosIndiretosAdicionais.filter(custo => custo.tempIndex !== indexToRemove);
    listItem.remove();
    atualizarTabelaCustosIndiretos();
    calcularCustos(); // <-- Importante!
    salvarDadosFirebase();// Salva no Firebase após remover novo custo indireto
}

function atualizarTabelaCustosIndiretos() {
    const tbody = document.querySelector('#tabela-custos-indiretos tbody');
    tbody.innerHTML = '';
    const horasTrabalhadas = maoDeObra.horas;

    if (horasTrabalhadas === undefined || horasTrabalhadas === null || horasTrabalhadas <= 0) {
        const row = tbody.insertRow();
        const cellMensagem = row.insertCell();
        cellMensagem.textContent = "Preencha as 'Horas trabalhadas por mês' no menu 'Custo de Mão de Obra' para calcular o custo por hora.";
        cellMensagem.colSpan = 4;
        return;
    }

    const custosExibicao = [...custosIndiretosPredefinidos, ...custosIndiretosAdicionais].filter(custo => custo.valorMensal > 0);
    const custosFiltrados = custosExibicao.filter(custo => custo.descricao.toLowerCase().includes(termoBusca));

   custosFiltrados.forEach((custo) => {
        const originalIndexPredefinidos = custosIndiretosPredefinidos.findIndex(c => c.descricao === custo.descricao);
        const originalAdicional = custosIndiretosAdicionais.find(c => c.descricao === custo.descricao && c.tempIndex === custo.tempIndex);


        if (custo.valorMensal > 0 || originalAdicional) {
            const row = tbody.insertRow();
            const cellDescricao = row.insertCell();
            const cellValorMensal = row.insertCell();
            const cellValorHoraTrabalhada = row.insertCell();
            const cellAcoes = row.insertCell();

            cellDescricao.textContent = custo.descricao;
            cellValorMensal.textContent = formatarMoeda(custo.valorMensal);

            const valorPorHora = custo.valorMensal / horasTrabalhadas;
            cellValorHoraTrabalhada.textContent = formatarMoeda(valorPorHora);

            // Usa o tipo e o índice/tempIndex corretos
            let botaoAcao;
            if (originalIndexPredefinidos !== -1) {
                botaoAcao = document.createElement('button');
                botaoAcao.textContent = 'Zerar';
                botaoAcao.onclick = function() { zerarCustoIndireto(originalIndexPredefinidos, 'predefinido'); };
            } else if (originalAdicional) {
                botaoAcao = document.createElement('button');
                botaoAcao.textContent = 'Zerar'; // Usa "Zerar" em vez de "Remover"
                botaoAcao.onclick = function() { zerarCustoIndireto(custo.tempIndex, 'adicional'); };
            }

            cellAcoes.appendChild(botaoAcao);

        }
    });
}

// --- Produtos Cadastrados ---
function cadastrarProduto() {
    const nomeProduto = document.getElementById('nome-produto').value;
    const tabelaMateriaisProduto = document.getElementById('tabela-materiais-produto').querySelector('tbody');
    const linhasMateriais = tabelaMateriaisProduto.rows;

    if (!nomeProduto || linhasMateriais.length === 0) {
        alert("Por favor, preencha o nome do produto e adicione pelo menos um material.");
        return;
    }

    let materiaisDoProduto = [];
    let custoTotalMateriaisProduto = 0;

    for (let i = 0; i < linhasMateriais.length; i++) {
        const linha = linhasMateriais[i];
        const nomeMaterial = linha.cells[0].textContent;
        const tipoMaterial = linha.cells[1].textContent.split(' ')[0]; // Pega só a primeira parte (tipo)
        const custoUnitarioMaterial = parseFloat(linha.cells[2].textContent.replace(/[^\d.,-]/g, '').replace('.', '').replace(',', '.'));

        // --- DIMENSOES (agora em sua própria célula) ---
        const larguraInput = linha.cells[3].querySelector('.dimensoes-input.largura');
        const alturaInput = linha.cells[3].querySelector('.dimensoes-input.altura');
        const comprimentoInput = linha.cells[3].querySelector('.dimensoes-input.comprimento'); //Se for comprimento

        const largura = larguraInput ? parseFloat(larguraInput.value) : 0;
        const altura = alturaInput ? parseFloat(alturaInput.value) : 0;
        const comprimento = comprimentoInput? parseFloat(comprimentoInput.value) : 0;


        // --- QUANTIDADE (agora separada das dimensões) ---
        const inputQuantidade = linha.cells[4].querySelector('.quantidade-input');  // Célula 4
        let quantidadeMaterial = quantidadeInput ? parseFloat(quantidadeInput.value) : 0;


        // --- CÁLCULO DO CUSTO TOTAL (CORREÇÃO AQUI) ---
        let custoTotalMaterial = 0;
        if (tipoMaterial === 'Área') {
            const area = (largura * altura) / 10000; // Calcula a área em m²
            custoTotalMaterial = custoUnitarioMaterial * area;
        } else if (tipoMaterial === 'Comprimento') {
            // CONVERTE comprimento de cm para m ANTES de calcular o custo
            const comprimentoEmMetros = comprimento / 100;
            custoTotalMaterial = custoUnitarioMaterial * comprimentoEmMetros; // Usa o comprimento em METROS
        } else {
          custoTotalMaterial = custoUnitarioMaterial * quantidadeMaterial;
        }


        materiaisDoProduto.push({
            nome: nomeMaterial,
            tipo: tipoMaterial,
            custoUnitario: custoUnitarioMaterial,
            largura: largura,      // Valor da largura
            altura: altura,       // Valor da altura
            comprimento: comprimento, //Comprimento *em cm* (para consistência e edição)
            quantidade: quantidadeMaterial, // Valor da QUANTIDADE (separado)
            custoTotal: custoTotalMaterial
        });
        custoTotalMateriaisProduto += custoTotalMaterial;
    }

    const produto = {
        nome: nomeProduto,
        materiais: materiaisDoProduto,
        custoMateriais: custoTotalMateriaisProduto
    };
    produtos.push(produto);

    atualizarTabelaProdutosCadastrados();
    limparFormulario('form-produtos-cadastrados');
    tabelaMateriaisProduto.innerHTML = '';
    salvarDadosFirebase();// Salva no Firebase após cadastrar produto
    alert('Produto cadastrado com sucesso!');
}

function atualizarTabelaProdutosCadastrados() {
    const tbody = document.querySelector('#tabela-produtos tbody');
    tbody.innerHTML = '';

    produtos.forEach((produto, index) => {
        const row = tbody.insertRow();
        const cellNomeProduto = row.insertCell();
        const cellMateriaisUtilizados = row.insertCell();
        const cellCustoTotalMateriais = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNomeProduto.textContent = produto.nome;

        let listaMateriaisHTML = '<ul>';
        produto.materiais.forEach(material => {
            let dimensoesTexto = '';
            if (material.tipo === 'Área') {
                dimensoesTexto = `(${material.largura.toFixed(2)}cm x ${material.altura.toFixed(2)}cm)`;
            } else if (material.tipo === 'Comprimento') {
                dimensoesTexto = `(${material.comprimento.toFixed(2)}cm)`;
            }
            listaMateriaisHTML += `<li>${material.nome} ${dimensoesTexto} - ${formatarMoeda(material.custoTotal)} (Qtd: ${material.quantidade.toFixed(2)})</li>`;
        });
        listaMateriaisHTML += '</ul>';
        cellMateriaisUtilizados.innerHTML = listaMateriaisHTML;
        cellCustoTotalMateriais.textContent = formatarMoeda(produto.custoMateriais);

        const botaoEditarProduto = document.createElement('button');
        botaoEditarProduto.textContent = 'Editar';
        botaoEditarProduto.addEventListener('click', function() {
            editarProduto(index);
        });
        cellAcoes.appendChild(botaoEditarProduto);

        const botaoRemoverProduto = document.createElement('button');
        botaoRemoverProduto.textContent = 'Remover';
        botaoRemoverProduto.addEventListener('click', function() {
            removerProduto(index);
        });
        cellAcoes.appendChild(botaoRemoverProduto);
    });
}

function buscarProdutosCadastrados() {
    const termoBusca = document.getElementById('busca-produto').value.toLowerCase();
    const tbody = document.querySelector('#tabela-produtos tbody');
    tbody.innerHTML = '';

    const produtosFiltrados = produtos.filter(produto => produto.nome.toLowerCase().includes(termoBusca));

    produtosFiltrados.forEach((produto, index) => {
		const row = tbody.insertRow();
        const cellNomeProduto = row.insertCell();
        const cellMateriaisUtilizados = row.insertCell();
        const cellCustoTotalMateriais = row.insertCell();
        const cellAcoes = row.insertCell();

        cellNomeProduto.textContent = produto.nome;

        let listaMateriaisHTML = '<ul>';
        produto.materiais.forEach(material => {
			//Modificação para exibir largura e altura.
            let dimensoesTexto = '';
            if (material.tipo === 'Área') {
                dimensoesTexto = `(${material.largura.toFixed(2)}cm x ${material.altura.toFixed(2)}cm)`;
            }else if (material.tipo === 'Comprimento') {
                dimensoesTexto = `(${material.comprimento.toFixed(2)}cm)`; //Mostra o comprimento
            }
            listaMateriaisHTML += `<li>${material.nome} ${dimensoesTexto} - ${formatarMoeda(material.custoTotal)} (Qtd: ${material.quantidade.toFixed(2)})</li>`;
        });
        listaMateriaisHTML += '</ul>';
        cellMateriaisUtilizados.innerHTML = listaMateriaisHTML;
        cellCustoTotalMateriais.textContent = formatarMoeda(produto.custoMateriais);

        const botaoEditarProduto = document.createElement('button');
        botaoEditarProduto.textContent = 'Editar';
        botaoEditarProduto.addEventListener('click', function() {
            editarProduto(index);
        });
        cellAcoes.appendChild(botaoEditarProduto);

        const botaoRemoverProduto = document.createElement('button');
        botaoRemoverProduto.textContent = 'Remover';
        botaoRemoverProduto.addEventListener('click', function() {
            removerProduto(index);
        });
        cellAcoes.appendChild(botaoRemoverProduto);
    });
}

function adicionarMaterialNaTabelaProduto(material) {
    const tbody = document.querySelector('#tabela-materiais-produto tbody');
    const row = tbody.insertRow();
    const cellNome = row.insertCell();
    const cellTipo = row.insertCell();
    const cellCustoUnitario = row.insertCell();
    const cellDimensoes = row.insertCell();
    const cellQuantidade = row.insertCell();
    const cellCustoTotal = row.insertCell();
    const cellAcoes = row.insertCell();

    cellNome.textContent = material.nome;
    let unidade = '';
    switch (material.tipo) {
        case 'comprimento': unidade = ' (m)'; break;
        case 'litro': unidade = ' (L)'; break;
        case 'quilo': unidade = ' (kg)'; break;
        case 'unidade': unidade = ' (un)'; break;
        case 'area': unidade = ' (m²)'; break;
    }
    cellTipo.textContent = material.tipo.charAt(0).toUpperCase() + material.tipo.slice(1) + unidade;
    cellCustoUnitario.textContent = formatarMoeda(material.custoUnitario);

    // --- Campos de Dimensões (Largura, Altura e Comprimento) ---
    // MODIFICAÇÃO AQUI: Adiciona a unidade de medida ao placeholder
    let larguraInput, alturaInput, comprimentoInput;

    if (material.tipo === 'area') {
        larguraInput = document.createElement('input');
        larguraInput.type = 'number';
        larguraInput.placeholder = 'Largura (cm)'; // Adiciona (cm)
        larguraInput.min = 0.01;
        larguraInput.step = 0.01;
        larguraInput.classList.add('dimensoes-input', 'largura');
        larguraInput.value = material.largura || '';

        alturaInput = document.createElement('input');
        alturaInput.type = 'number';
        alturaInput.placeholder = 'Altura (cm)'; // Adiciona (cm)
        alturaInput.min = 0.01;
        alturaInput.step = 0.01;
        alturaInput.classList.add('dimensoes-input', 'altura');
        alturaInput.value = material.altura || '';

        cellDimensoes.appendChild(larguraInput);
        cellDimensoes.appendChild(alturaInput);

    } else if (material.tipo === 'comprimento') {
        comprimentoInput = document.createElement('input');
        comprimentoInput.type = 'number';
        comprimentoInput.placeholder = 'Comprimento (cm)'; // Adiciona (cm)
        comprimentoInput.min = 0.01;
        comprimentoInput.step = 0.01;
        comprimentoInput.classList.add('dimensoes-input', 'comprimento');
        comprimentoInput.value = material.comprimento || '';
        cellDimensoes.appendChild(comprimentoInput);
    }
    // --- Campo de Quantidade (AGORA SEPARADO) ---
    const inputQuantidade = document.createElement('input');
    inputQuantidade.type = 'number';
    inputQuantidade.value = material.quantidade || 1;
    inputQuantidade.min = 0.01;
    inputQuantidade.step = 0.01;
    inputQuantidade.classList.add('quantidade-input');
    inputQuantidade.readOnly = material.tipo === 'area';


    const unidadeMedidaSpan = document.createElement('span');
    unidadeMedidaSpan.classList.add('unidade-medida');
    // --- Lógica para Área (agora calcula e exibe a área corretamente) ---
    if (material.tipo === 'area') {
        const areaSpan = document.createElement('span');
        areaSpan.classList.add('dimensoes-span');
        cellDimensoes.appendChild(areaSpan);
        unidadeMedidaSpan.textContent = '';

        // Função para calcular a área e atualizar o custo total
        function calcularAreaEAtualizar() {
            const largura = parseFloat(larguraInput.value) || 0;
            const altura = parseFloat(alturaInput.value) || 0;

            if (isNaN(largura) || largura <= 0 || isNaN(altura) || altura <= 0) {
                areaSpan.textContent = '0.00 m²';
                inputQuantidade.value = 0;
                calcularCustoTotalMaterial();
                return;
            }

            const area = (largura * altura) / 10000;
            areaSpan.textContent = area.toFixed(2) + ' m²';
            inputQuantidade.value = area.toFixed(2);
            calcularCustoTotalMaterial();
        }

        larguraInput.addEventListener('input', calcularAreaEAtualizar);
        alturaInput.addEventListener('input', calcularAreaEAtualizar);

        calcularAreaEAtualizar();

    } else if(material.tipo === 'comprimento'){
        const comprimentoSpan = document.createElement('span');
        comprimentoSpan.classList.add('dimensoes-span');
        cellDimensoes.appendChild(comprimentoSpan);
        unidadeMedidaSpan.textContent = '';

        function calcularComprimentoEAtualizar(){
            const comprimento = parseFloat(comprimentoInput.value) || 0;

            if(isNaN(comprimento) || comprimento <= 0){
                comprimentoSpan.textContent = '0.00 cm';
                inputQuantidade.value = 0;
                calcularCustoTotalMaterial();
                return;
            }

            comprimentoSpan.textContent = comprimento.toFixed(2) + ' cm';
            inputQuantidade.value = comprimento.toFixed(2);
            calcularCustoTotalMaterial();
        }
        comprimentoInput.addEventListener('input', calcularComprimentoEAtualizar);
        calcularComprimentoEAtualizar();

    }else {
        unidadeMedidaSpan.textContent = unidade;
        inputQuantidade.addEventListener('input', calcularCustoTotalMaterial);
    }

    cellQuantidade.appendChild(inputQuantidade);
    cellQuantidade.appendChild(unidadeMedidaSpan);


    // --- Função para calcular o custo total ---
    function calcularCustoTotalMaterial() {
        let quantidade = parseFloat(inputQuantidade.value);
         if (isNaN(quantidade) || quantidade <= 0) {
            if(material.tipo !== 'area' && material.tipo !== 'comprimento'){
                quantidade = 0.01;
                inputQuantidade.value = quantidade;
            } else{
                quantidade = 0;
            }
        }

        let custoTotal = 0;
        if(material.tipo === "area"){
            const largura = parseFloat(larguraInput.value) || 0;
            const altura = parseFloat(alturaInput.value) || 0;
            const area = (largura * altura) / 10000;
            custoTotal = material.custoUnitario * area;

        } else if(material.tipo === "comprimento") {
            const comprimento = parseFloat(comprimentoInput.value) || 0;
            const comprimentoEmMetros = comprimento / 100;
            custoTotal = material.custoUnitario * comprimentoEmMetros;

        } else {
          custoTotal = material.custoUnitario * quantidade;
        }

        cellCustoTotal.textContent = formatarMoeda(custoTotal);
    }

    calcularCustoTotalMaterial();


    const botaoRemoverMaterial = document.createElement('button');
    botaoRemoverMaterial.textContent = 'Remover';
    botaoRemoverMaterial.addEventListener('click', function() {
        removerLinhaMaterial(row);
    });
    cellAcoes.appendChild(botaoRemoverMaterial);
}

function editarProduto(index) {
    const produto = produtos[index];
    if (!produto) return;

    document.getElementById('nome-produto').value = produto.nome;

    const tabelaMateriaisProdutoBody = document.querySelector('#tabela-materiais-produto tbody');
    tabelaMateriaisProdutoBody.innerHTML = '';

    produto.materiais.forEach(material => {
        adicionarMaterialNaTabelaProduto(material);
    });

    produtos.splice(index, 1);
    atualizarTabelaProdutosCadastrados();
    salvarDadosFirebase();// Salva no Firebase após editar produto
    document.getElementById('produtos-cadastrados').scrollIntoView({ behavior: 'smooth' });
    document.querySelector('#produtos-cadastrados h2').textContent = 'Editar Produto';
}

function removerProduto(index) {
    produtos.splice(index, 1);
    atualizarTabelaProdutosCadastrados();
    salvarDadosFirebase();// Salva no Firebase após remover produto
}

// --- Pesquisa e Adição de Materiais na Seção Produtos ---
document.getElementById('pesquisa-material').addEventListener('input', function() {
    const termoPesquisa = this.value.toLowerCase();
    const resultadosPesquisaDiv = document.getElementById('resultados-pesquisa');
    resultadosPesquisaDiv.innerHTML = '';

    if (termoPesquisa.length < 2) {
        resultadosPesquisaDiv.style.display = 'none';
        return;
    }

    const materiaisFiltrados = materiais.filter(material => material.nome.toLowerCase().includes(termoPesquisa));

    if (materiaisFiltrados.length > 0) {
        resultadosPesquisaDiv.style.display = 'block';
        materiaisFiltrados.forEach(material => {
            const resultadoDiv = document.createElement('div');
            resultadoDiv.textContent = material.nome + ' (' + material.tipo + ') - Custo Unitário: ' + formatarMoeda(material.custoUnitario);
            resultadoDiv.addEventListener('click', function() {
                adicionarMaterialNaTabelaProduto(material);
                document.getElementById('pesquisa-material').value = '';
                resultadosPesquisaDiv.innerHTML = '';
                resultadosPesquisaDiv.style.display = 'none';
                salvarDadosFirebase();// Salva no Firebase após adicionar material na tabela de produtos
            });
            resultadosPesquisaDiv.appendChild(resultadoDiv);
        });
    } else {
        resultadosPesquisaDiv.style.display = 'none';
    }
});

function removerLinhaMaterial(row) {
    row.remove();
     salvarDadosFirebase();// Salva no Firebase após remover linha de material
}

// --- Cálculo da Precificação (Refatorado) ---

function buscarProdutosAutocomplete() {
    const termo = document.getElementById('produto-pesquisa').value.toLowerCase();
    const resultadosDiv = document.getElementById('produto-resultados');
    resultadosDiv.innerHTML = ''; // Limpa resultados anteriores
    resultadosDiv.classList.remove('hidden'); //Mostra a div

    if (termo.length < 2) {
        resultadosDiv.classList.add('hidden'); //Esconde se termo muito curto.
        return; // Sai se o termo for muito curto
    }

    const produtosFiltrados = produtos.filter(produto => produto.nome.toLowerCase().includes(termo));

    if (produtosFiltrados.length > 0) {
        produtosFiltrados.forEach(produto => {
            const div = document.createElement('div');
            div.textContent = produto.nome;
            div.addEventListener('click', function() {
                selecionarProduto(produto.nome); // Função para selecionar
                resultadosDiv.classList.add('hidden'); // Esconde após seleção
            });
            resultadosDiv.appendChild(div);
        });
    } else {
       resultadosDiv.classList.add('hidden'); //Esconde caso não encontre.
    }
}

function selecionarProduto(nomeProduto) {
    document.getElementById('produto-pesquisa').value = nomeProduto; // Preenche o campo
    carregarDadosProduto(nomeProduto); // Carrega os dados (custo)
}

function carregarDadosProduto(nomeProduto) {
    const produto = produtos.find(p => p.nome === nomeProduto);

    if (produto) {
        document.getElementById('custo-produto').textContent = formatarMoeda(produto.custoMateriais);
        // Exibe os detalhes do produto (materiais)
        const detalhesProdutoDiv = document.getElementById('detalhes-produto');
        const listaMateriais = document.getElementById('lista-materiais-produto');
        listaMateriais.innerHTML = ''; // Limpa a lista

        produto.materiais.forEach(material => {
            //Modificação para exibir largura e altura
			let dimensoesTexto = '';
            if (material.tipo === 'Área') {
                dimensoesTexto = `(${material.largura.toFixed(2)}cm x ${material.altura.toFixed(2)}cm)`;
            }else if (material.tipo === 'Comprimento') {
                dimensoesTexto = `(${material.comprimento.toFixed(2)}cm)`; //Mostra o comprimento
            }
            const li = document.createElement('li');
            li.textContent = `${material.nome} ${dimensoesTexto} (${material.tipo}) - Qtd: ${material.quantidade.toFixed(2)} - Custo: ${formatarMoeda(material.custoTotal)}`;  //Quantidade com 2 casas
            listaMateriais.appendChild(li);
        });
        detalhesProdutoDiv.style.display = 'block'; // Mostra a div

        calcularCustos(); // Recalcula *tudo*
    } else {
        document.getElementById('custo-produto').textContent = 'R$ 0,00';
         document.getElementById('detalhes-produto').style.display = 'none'; // Esconde se não tiver produto
    }
}

function calcularCustos() {
    const horasProduto = parseFloat(document.getElementById('horas-produto').value) || 0;

    // 1. Custo de Mão de Obra (DETALHADO)
    const custoMaoDeObra = maoDeObra.valorHora * horasProduto;
    const custoFerias13o = maoDeObra.custoFerias13o * horasProduto;
    const totalMaoDeObra = custoMaoDeObra + custoFerias13o;

    document.getElementById('custo-mao-de-obra-detalhe').textContent = formatarMoeda(custoMaoDeObra);
    document.getElementById('custo-ferias-13o-detalhe').textContent = formatarMoeda(custoFerias13o);
    document.getElementById('total-mao-de-obra').textContent = formatarMoeda(totalMaoDeObra);


    // 2. Custo do Produto (já é carregado em carregarDadosProduto)

    // 3. Custos Indiretos (DETALHADO, por item, e SÓ SE > 0)
    let custoIndiretoTotalProduto = 0;
    const listaCustosIndiretosDetalhes = document.getElementById('lista-custos-indiretos-detalhes');
    listaCustosIndiretosDetalhes.innerHTML = ''; // Limpa a lista

    custosIndiretosPredefinidos.forEach(custo => {
        const custoPorHora = custo.valorMensal / maoDeObra.horas;
        const custoItemProduto = custoPorHora * horasProduto;

        // AQUI: Só adiciona à lista se o custo for > 0
        if (custoItemProduto > 0) {
            custoIndiretoTotalProduto += custoItemProduto;
            const li = document.createElement('li');
            li.textContent = `${custo.descricao}: ${formatarMoeda(custoItemProduto)}`;
            listaCustosIndiretosDetalhes.appendChild(li);
        }
    });

    custosIndiretosAdicionais.forEach(custo => {
        const custoPorHora = custo.valorMensal / maoDeObra.horas;
        const custoItemProduto = custoPorHora * horasProduto;

        // AQUI: Só adiciona à lista se o custo for > 0
        if (custoItemProduto > 0) {
            custoIndiretoTotalProduto += custoItemProduto;
            const li = document.createElement('li');
            li.textContent = `${custo.descricao}: ${formatarMoeda(custoItemProduto)}`;
            listaCustosIndiretosDetalhes.appendChild(li);
        }
    });

     document.getElementById('custo-indireto').textContent = formatarMoeda(custoIndiretoTotalProduto); // Total (por hora)

    // 4. Subtotal
    const nomeProduto = document.getElementById('produto-pesquisa').value;
    const produto = produtos.find(p => p.nome === nomeProduto);
    const custoProduto = produto ? produto.custoMateriais : 0;
    const subtotal = custoProduto + totalMaoDeObra + custoIndiretoTotalProduto;
    document.getElementById('subtotal').textContent = formatarMoeda(subtotal);

    calcularPrecoVendaFinal(); //Chama para já calcular com os novos valores.
}

function calcularPrecoVendaFinal(){
   const margemLucro = parseFloat(document.getElementById('margem-lucro-final').value) / 100 || 0;
    const subtotalTexto = document.getElementById('subtotal').textContent;

    // Converte o subtotal para um número, tratando a formatação de moeda
    const subtotalNumerico = parseFloat(subtotalTexto.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.')) || 0;
    const precoVenda = subtotalNumerico * (1 + margemLucro);
     const margemLucroValor = precoVenda - subtotalNumerico; //Calcula a margem
    document.getElementById('margem-lucro-valor').textContent = formatarMoeda(margemLucroValor);
    document.getElementById('total-final').textContent = formatarMoeda(precoVenda);

    calcularTotalComTaxas(); //Chama a função para o cálculo final.
}

// --- Função para Taxa de Crédito ---
function salvarTaxaCredito() {
    const incluir = document.getElementById('incluir-taxa-credito-sim').checked;
    const percentual = parseFloat(document.getElementById('taxa-credito-percentual').value);

    if (incluir && (isNaN(percentual) || percentual < 0)) {
        alert("Por favor, insira um valor percentual válido para a taxa.");
        return;
    }

    taxaCredito.incluir = incluir;
    taxaCredito.percentual = incluir ? percentual : 0; //Salva 0 se não incluir.
    calcularTotalComTaxas(); //Recalcula o total com a nova taxa.
    salvarDadosFirebase();// Salva no Firebase após salvar taxa de crédito
}

function calcularTotalComTaxas() {
    const precoVendaTexto = document.getElementById('total-final').textContent; //Pega do total com margem.
    const precoVendaNumerico = parseFloat(precoVendaTexto.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.')) || 0;

    let taxaCreditoValor = 0;
    if (taxaCredito.incluir) {
        taxaCreditoValor = precoVendaNumerico * (taxaCredito.percentual / 100);
    }
    document.getElementById('taxa-credito-valor').textContent = formatarMoeda(taxaCreditoValor);

    const totalFinalComTaxas = precoVendaNumerico + taxaCreditoValor;
    document.getElementById('total-final-com-taxas').textContent = formatarMoeda(totalFinalComTaxas);
}

// Event Listeners (ajustado)
document.addEventListener('DOMContentLoaded', () => {

    // Não precisa mais carregar produtos em um <select>

    // Evento para o autocomplete
    document.getElementById('produto-pesquisa').addEventListener('input', buscarProdutosAutocomplete);

    // Eventos para cálculo
    document.getElementById('horas-produto').addEventListener('input', calcularCustos);
     document.getElementById('margem-lucro-final').addEventListener('input', calcularPrecoVendaFinal);

     //Eventos para a taxa
     document.getElementById('incluir-taxa-credito-sim').addEventListener('change', salvarTaxaCredito);
      document.getElementById('incluir-taxa-credito-nao').addEventListener('change', salvarTaxaCredito);
     document.getElementById('taxa-credito-percentual').addEventListener('input', salvarTaxaCredito);
});

//Para esconder o autocomplete quando clica fora.
document.addEventListener('click', function(event) {
    const autocompleteDiv = document.getElementById('produto-resultados');
    const inputPesquisa = document.getElementById('produto-pesquisa');

    if (event.target !== autocompleteDiv && event.target !== inputPesquisa) {
        autocompleteDiv.classList.add('hidden');
    }
});
