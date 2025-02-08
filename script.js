/* ==== INÍCIO SEÇÃO - VARIÁVEIS GLOBAIS ==== */
let orcamentos = [];
let pedidos = [];
let numeroOrcamento = 1;
let numeroPedido = 1;
const anoAtual = new Date().getFullYear();
let orcamentoEditando = null; // Variável para controlar se está editando um orçamento
let usuarioLogado = null;  // Variável global para armazenar o usuário logado

// Removida a variável custosIndiretosPredefinidosBase, pois ela pertence à precificação
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
            console.log("Login bem-sucedido. Chamando carregarDados()"); // LOG
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
            console.log("Conta criada. Chamando salvarDadosFirebase()"); // LOG
            salvarDadosFirebase(); // <--- CORREÇÃO: Salva os dados iniciais do novo usuário
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
        //Dados da precificação (serão adicionados aqui quando integrarmos)
        // materiais,
        // maoDeObra,
        // custosIndiretosPredefinidos,
        // custosIndiretosAdicionais,
        // produtos,
        // taxaCredito,
        ultimoBackup: new Date().toISOString()
    };

    console.log("Dados a serem salvos:", dadosParaSalvar); // LOG: Dados antes de salvar

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

    console.log("carregarDados() chamada"); // LOG

    database.ref('usuarios/' + usuarioLogado.uid).once('value')
        .then((snapshot) => {
            const dados = snapshot.val();
            if (dados) {
                console.log("Dados carregados do Firebase:", dados); // LOG: Dados carregados

                orcamentos = dados.orcamentos || [];
                pedidos = dados.pedidos || [];
                numeroOrcamento = dados.numeroOrcamento || 1;
                numeroPedido = dados.numeroPedido || 1;

                //Dados da precificação (serão adicionados aqui quando integrarmos)
                // materiais = dados.materiais || [];
                // maoDeObra = dados.maoDeObra || { salario: 0, horas: 220, valorHora: 0, incluirFerias13o: false, custoFerias13o: 0 };
                // custosIndiretosPredefinidos = dados.custosIndiretosPredefinidos || JSON.parse(JSON.stringify(custosIndiretosPredefinidosBase));
                // custosIndiretosAdicionais = dados.custosIndiretosAdicionais || [];
                // produtos = dados.produtos || [];
                // taxaCredito = dados.taxaCredito || {percentual: 6, incluir: false};


                mostrarOrcamentosGerados();
                mostrarPedidosRealizados();
                atualizarPainelUltimoBackup();

                //Precificação (chamadas serão adicionadas aqui quando integrarmos)
                // atualizarTabelaMateriaisInsumos();
                // carregarCustosIndiretosPredefinidos();
                // atualizarTabelaCustosIndiretos();
                // atualizarTabelaProdutosCadastrados();


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

