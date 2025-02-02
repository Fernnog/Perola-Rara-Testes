/* ==== VARIÁVEIS GLOBAIS ==== */
let materiais = [];
let insumos = [];
let maoDeObra = [];
let equipamentos = [];
let custosIndiretos = [];
let despesas = [];
let impostos = [];
let produtos = [];

/* ==== FUNÇÕES AUXILIARES ==== */
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mostrarSubMenu(submenuId) {
    // Esconde todas as seções de conteúdo
    const conteudos = ['materiais', 'insumos', 'mao-de-obra', 'equipamentos', 'custos-indiretos', 'despesas', 'impostos', 'calculo-precificacao'];
    conteudos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = 'none';
        }
    });

    // Mostra a seção de conteúdo correspondente ao submenu clicado
    const submenu = document.getElementById(submenuId);
    if (submenu) {
        submenu.style.display = 'block';
    }
}

function limparFormulario(formId) {
    document.getElementById(formId).reset();
}

/* ==== FUNÇÕES PARA A SEÇÃO DE MATERIAIS ==== */
function cadastrarMaterial() {
    const nome = document.getElementById('nome-material').value;
    const unidadeMedida = document.getElementById('unidade-medida-material').value;
    const valorTotal = parseFloat(document.getElementById('valor-total-material').value);
    const quantidade = parseFloat(document.getElementById('quantidade-material').value);

    let custoUnitario;
    switch (unidadeMedida) {
        case 'metro':
        case 'litro':
        case 'quilo':
        case 'unidade':
            custoUnitario = calcularPrecoPorUnidade(valorTotal, quantidade);
            break;
    }

    const material = { nome, unidadeMedida, custoUnitario };
    materiais.push(material);

    atualizarTabelaMateriais();
    limparFormulario('form-materiais');
}

function calcularPrecoPorUnidade(valorTotal, quantidade) {
    return valorTotal / quantidade;
}

function atualizarTabelaMateriais() {
    const tbody = document.querySelector('#tabela-materiais tbody');
    tbody.innerHTML = '';

    materiais.forEach(material => {
        const row = tbody.insertRow();
        const cellNome = row.insertCell();
        const cellUnidadeMedida = row.insertCell();
        const cellCustoUnitario = row.insertCell();

        cellNome.textContent = material.nome;
        cellUnidadeMedida.textContent = material.unidadeMedida;
        cellCustoUnitario.textContent = formatarMoeda(material.custoUnitario);
    });
}

/* ==== FUNÇÕES PARA A SEÇÃO DE INSUMOS ==== */
function cadastrarInsumo() {
    const nome = document.getElementById('nome-insumo').value;
    const unidadeMedida = document.getElementById('unidade-medida-insumo').value;
    const valorTotal = parseFloat(document.getElementById('valor-total-insumo').value);
    const quantidade = parseFloat(document.getElementById('quantidade-insumo').value);

    let custoUnitario;
    switch (unidadeMedida) {
        case 'metro':
        case 'litro':
        case 'quilo':
        case 'unidade':
            custoUnitario = calcularPrecoPorUnidade(valorTotal, quantidade);
            break;
    }

    const insumo = { nome, unidadeMedida, custoUnitario };
    insumos.push(insumo);

    atualizarTabelaInsumos();
    limparFormulario('form-insumos');
}

function atualizarTabelaInsumos() {
    const tbody = document.querySelector('#tabela-insumos tbody');
    tbody.innerHTML = '';

    insumos.forEach(insumo => {
        const row = tbody.insertRow();
        const cellNome = row.insertCell();
        const cellUnidadeMedida = row.insertCell();
        const cellCustoUnitario = row.insertCell();

        cellNome.textContent = insumo.nome;
        cellUnidadeMedida.textContent = insumo.unidadeMedida;
        cellCustoUnitario.textContent = formatarMoeda(insumo.custoUnitario);
    });
}

/* ==== FUNÇÕES PARA A SEÇÃO DE MÃO DE OBRA ==== */
function cadastrarMaoDeObra() {
    const horasTrabalhadas = parseFloat(document.getElementById('horas-trabalhadas').value);
    const valorHora = parseFloat(document.getElementById('valor-hora').value);
    const percentualEncargos = parseFloat(document.getElementById('percentual-encargos').value) / 100;

    const custoTotal = calcularCustoMaoDeObra(horasTrabalhadas, valorHora, percentualEncargos);

    maoDeObra.push({ horasTrabalhadas, valorHora, percentualEncargos, custoTotal });

    atualizarTabelaMaoDeObra();
    limparFormulario('form-mao-de-obra');
}

function calcularCustoMaoDeObra(horasTrabalhadas, valorHora, percentualEncargos) {
    const custoSemEncargos = horasTrabalhadas * valorHora;
    return custoSemEncargos * (1 + percentualEncargos);
}

function atualizarTabelaMaoDeObra() {
    const tbody = document.querySelector('#tabela-mao-de-obra tbody');
    tbody.innerHTML = '';

    maoDeObra.forEach(item => {
        const row = tbody.insertRow();
        const cellHoras = row.insertCell();
        const cellValorHora = row.insertCell();
        const cellCustoTotal = row.insertCell();

        cellHoras.textContent = item.horasTrabalhadas;
        cellValorHora.textContent = formatarMoeda(item.valorHora);
        cellCustoTotal.textContent = formatarMoeda(item.custoTotal);
    });
}

/* ==== FUNÇÕES PARA A SEÇÃO DE EQUIPAMENTOS E FERRAMENTAS ==== */
function cadastrarEquipamento() {
    const nome = document.getElementById('nome-equipamento').value;
    const valor = parseFloat(document.getElementById('valor-equipamento').value);
    const vidaUtil = parseFloat(document.getElementById('vida-util-equipamento').value);

    const depreciacaoPorUnidade = calcularDepreciacao(valor, vidaUtil);

    const equipamento = { nome, valor, vidaUtil, depreciacaoPorUnidade };
    equipamentos.push(equipamento);

    atualizarTabelaEquipamentos();
    limparFormulario('form-equipamentos');
}

function calcularDepreciacao(valor, vidaUtil) {
    return valor / vidaUtil;
}

function atualizarTabelaEquipamentos() {
    const tbody = document.querySelector('#tabela-equipamentos tbody');
    tbody.innerHTML = '';

    equipamentos.forEach(equipamento => {
        const row = tbody.insertRow();
        const cellNome = row.insertCell();
        const cellValor = row.insertCell();
        const cellVidaUtil = row.insertCell();
        const cellDepreciacao = row.insertCell();

        cellNome.textContent = equipamento.nome;
        cellValor.textContent = formatarMoeda(equipamento.valor);
        cellVidaUtil.textContent = equipamento.vidaUtil;
        cellDepreciacao.textContent = formatarMoeda(equipamento.depreciacaoPorUnidade);
    });
}

/* ==== FUNÇÕES PARA A SEÇÃO DE CUSTOS INDIRETOS ==== */
function cadastrarCustoIndireto() {
    const descricao = document.getElementById('descricao-custo-indireto').value;
    const valorMensal = parseFloat(document.getElementById('valor-custo-indireto').value);
    const unidadesProduzidas = parseFloat(document.getElementById('unidades-produzidas').value);

    const custoIndiretoPorUnidade = calcularCustosIndiretosUnitarios(valorMensal, unidadesProduzidas);

    const custoIndireto = { descricao, valorMensal, unidadesProduzidas, custoIndiretoPorUnidade };
    custosIndiretos.push(custoIndireto);

    atualizarTabelaCustosIndiretos();
    limparFormulario('form-custos-indiretos');
}

function calcularCustosIndiretosUnitarios(despesasTotais, numeroPecas) {
    return despesasTotais / numeroPecas;
}

function atualizarTabelaCustosIndiretos() {
    const tbody = document.querySelector('#tabela-custos-indiretos tbody');
    tbody.innerHTML = '';

    custosIndiretos.forEach(custo => {
        const row = tbody.insertRow();
        const cellDescricao = row.insertCell();
        const cellValorMensal = row.insertCell();
        const cellUnidadesProduzidas = row.insertCell();
        const cellCustoPorUnidade = row.insertCell();

        cellDescricao.textContent = custo.descricao;
        cellValorMensal.textContent = formatarMoeda(custo.valorMensal);
        cellUnidadesProduzidas.textContent = custo.unidadesProduzidas;
        cellCustoPorUnidade.textContent = formatarMoeda(custo.custoIndiretoPorUnidade);
    });
}

/* ==== FUNÇÕES PARA A SEÇÃO DE DESPESAS ADMINISTRATIVAS/COMERCIAIS ==== */
function cadastrarDespesa() {
    const descricao = document.getElementById('descricao-despesa').value;
    const valorMensal = parseFloat(document.getElementById('valor-despesa').value);
    const unidadesProduzidas = parseFloat(document.getElementById('unidades-produzidas-despesas').value);

    const custoPorUnidade = calcularCustosIndiretosUnitarios(valorMensal, unidadesProduzidas);

    const despesa = { descricao, valorMensal, unidadesProduzidas, custoPorUnidade };
    despesas.push(despesa);

    atualizarTabelaDespesas();
    limparFormulario('form-despesas');
}

function atualizarTabelaDespesas() {
    const tbody = document.querySelector('#tabela-despesas tbody');
    tbody.innerHTML = '';

    despesas.forEach(despesa => {
        const row = tbody.insertRow();
        const cellDescricao = row.insertCell();
        const cellValorMensal = row.insertCell();
        const cellUnidadesProduzidas = row.insertCell();
        const cellCustoPorUnidade = row.insertCell();

        cellDescricao.textContent = despesa.descricao;
        cellValorMensal.textContent = formatarMoeda(despesa.valorMensal);
        cellUnidadesProduzidas.textContent = despesa.unidadesProduzidas;
        cellCustoPorUnidade.textContent = formatarMoeda(despesa.custoPorUnidade);
    });
}

/* ==== FUNÇÕES PARA A SEÇÃO DE IMPOSTOS DIVERSOS ==== */
function cadastrarImposto() {
    const descricao = document.getElementById('descricao-imposto').value;
    const percentual = parseFloat(document.getElementById('percentual-imposto').value) / 100;

    const imposto = { descricao, percentual };
    impostos.push(imposto);

    atualizarTabelaImpostos();
    limparFormulario('form-impostos');
}

function atualizarTabelaImpostos() {
    const tbody = document.querySelector('#tabela-impostos tbody');
    tbody.innerHTML = '';

    impostos.forEach(imposto => {
        const row = tbody.insertRow();
        const cellDescricao = row.insertCell();
        const cellPercentual = row.insertCell();
        const cellValorImposto = row.insertCell(); // Esta célula será preenchida na etapa de cálculo

        cellDescricao.textContent = imposto.descricao;
        cellPercentual.textContent = (imposto.percentual * 100).toFixed(2) + '%';
        cellValorImposto.textContent = 'Calculado na Precificação';
    });
}

/* ==== FUNÇÕES PARA A SEÇÃO DE CÁLCULO DA PRECIFICAÇÃO ==== */

function adicionarProdutoCalculo() {
    const nomeProduto = document.getElementById('nome-produto').value;
    if (!nomeProduto) {
        alert('Por favor, insira o nome do produto.');
        return;
    }

    const produto = {
        nome: nomeProduto,
        materiais: 0,
        insumos: 0,
        maoDeObra: 0,
        equipamentos: 0,
        custosIndiretos: 0,
        despesas: 0,
        impostos: 0,
        custoTotal: 0,
        margemLucro: 0,
        precoVenda: 0
    };

    produtos.push(produto);
    atualizarTabelaCalculoPrecificacao();
    limparFormulario('form-calculo-precificacao');
}

function atualizarTabelaCalculoPrecificacao() {
    const tbody = document.querySelector('#tabela-calculo-precificacao tbody');
    tbody.innerHTML = '';

    produtos.forEach((produto, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${produto.nome}</td>
            <td contenteditable="true" onblur="atualizarCustoProduto(this, ${index}, 'materiais')">${formatarMoeda(produto.materiais)}</td>
            <td contenteditable="true" onblur="atualizarCustoProduto(this, ${index}, 'insumos')">${formatarMoeda(produto.insumos)}</td>
            <td contenteditable="true" onblur="atualizarCustoProduto(this, ${index}, 'maoDeObra')">${formatarMoeda(produto.maoDeObra)}</td>
            <td contenteditable="true" onblur="atualizarCustoProduto(this, ${index}, 'equipamentos')">${formatarMoeda(produto.equipamentos)}</td>
            <td contenteditable="true" onblur="atualizarCustoProduto(this, ${index}, 'custosIndiretos')">${formatarMoeda(produto.custosIndiretos)}</td>
            <td contenteditable="true" onblur="atualizarCustoProduto(this, ${index}, 'despesas')">${formatarMoeda(produto.despesas)}</td>
            <td contenteditable="true" onblur="atualizarCustoProduto(this, ${index}, 'impostos')">${formatarMoeda(produto.impostos)}</td>
            <td>${formatarMoeda(produto.custoTotal)}</td>
            <td contenteditable="true" onblur="atualizarCustoProduto(this, ${index}, 'margemLucro')">${(produto.margemLucro * 100).toFixed(2)}%</td>
            <td>${formatarMoeda(produto.precoVenda)}</td>
        `;
    });
}

function atualizarCustoProduto(elemento, indexProduto, tipoCusto) {
    const valor = parseFloat(elemento.textContent.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
    const produto = produtos[indexProduto];

    if (tipoCusto === 'margemLucro') {
        produto[tipoCusto] = valor / 100;
    } else {
        produto[tipoCusto] = valor;
    }

    atualizarTotaisProduto(produto);
    atualizarTabelaCalculoPrecificacao();
}

function atualizarTotaisProduto(produto) {
    produto.custoTotal = produto.materiais + produto.insumos + produto.maoDeObra +
        produto.equipamentos + produto.custosIndiretos + produto.despesas + produto.impostos;
    produto.precoVenda = produto.custoTotal * (1 + produto.margemLucro);
}
