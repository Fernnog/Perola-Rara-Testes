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
            custoUnitario = valorTotal / (comprimentoCm / 100);
            break;
        case "litro":
            custoUnitario = valorTotal / (volumeMl / 1000);
            break;
        case "quilo":
            custoUnitario = valorTotal / (pesoG / 1000);
            break;
        case "unidade":
            custoUnitario = valorTotal;
            break;
        case "area":
            custoUnitario = valorTotal / (larguraCm * alturaCm / 10000);
            break;
    }
    return custoUnitario;
}

/* Cadastrar Material/Insumo */
function cadastrarMaterialInsumo() {
    const nome = document.getElementById('nome-material').value;
    const valorTotal = parseFloat(document.getElementById('valor-total-material').value);
    const tipo = document.querySelector('input[name="tipo-material"]:checked').value;
    const comprimentoCm = (tipo === 'comprimento') ? parseFloat(document.getElementById('comprimento-cm').value) : 0;
    const volumeMl = (tipo === 'litro') ? parseFloat(document.getElementById('volume-ml').value) : 0;
    const pesoG = (tipo === 'quilo') ? parseFloat(document.getElementById('peso-g').value) : 0;
    const larguraCm = (tipo === 'area') ? parseFloat(document.getElementById('largura-cm').value) : 0;
    const alturaCm = (tipo === 'area') ? parseFloat(document.getElementById('altura-cm').value) : 0;

    const custoUnitario = calcularCustoUnitario(tipo, valorTotal, comprimentoCm, volumeMl, pesoG, larguraCm, alturaCm);

    const item = { nome, tipo, custoUnitario };
    materiais.push(item);

    atualizarTabelaMateriaisInsumos();
    limparFormulario('form-materiais-insumos');
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

    document.getElementById('nome-material').value = item.nome;
    document.getElementById('valor-total-material').value = item.custoUnitario;
    document.querySelector(`input[name="tipo-material"][value="${item.tipo}"]`).checked = true;
    document.querySelector(`input[name="tipo-material"][value="${item.tipo}"]`).dispatchEvent(new Event('change'));

    if (item.tipo === 'comprimento') {
        document.getElementById('comprimento-cm').value = 100;
    } else if (item.tipo === 'litro') {
        document.getElementById('volume-ml').value = 1000;
    } else if (item.tipo === 'quilo') {
        document.getElementById('peso-g').value = 1000;
    } else if (item.tipo === 'area') {
        document.getElementById('largura-cm').value = 100;
        document.getElementById('altura-cm').value = 100;
    }

    materiais.splice(index, 1);
    atualizarTabelaMateriaisInsumos();
    document.getElementById('materiais-insumos').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('titulo-materiais-insumos').textContent = 'Editar Material/Insumo';
}

function removerMaterialInsumo(index) {
    materiais.splice(index, 1);
    atualizarTabelaMateriaisInsumos();
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
            custosIndiretosAdicionais.push({ descricao: descricao, valorMensal: valorMensal, tempIndex: index });
        }
        atualizarTabelaCustosIndiretos(); // Atualiza a tabela
        calcularCustos();  // <-- Importante!

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
}

function atualizarTabelaCustosIndiretos() {
    const tbody = document.querySelector('#tabela-custos-indiretos tbody');
    tbody.innerHTML = '';
    const horasTrabalhadas = maoDeObra.horas;

    if (horasTrabalhadas === undefined || horasTrabalhadas === null || horasTrabalhadas <= 0) {
        const row = tbody.insertRow();
        const cellMensagem = row.insertCell();
        cellMensagem.textContent = "Preencha as 'Horas trabalhadas por mês' no menu 'Custo de Mão de Obra' para calcular o custo por hora.";
        cellMensagem.colSpan = 4; // Ocupa todas as colunas
        return; // Sai da função, pois não há como calcular
    }

    // Filtra os custos para exibir apenas os que têm valor maior que zero
    const custosPredefinidosParaExibir = custosIndiretosPredefinidos.filter(custo => custo.valorMensal > 0);
    const custosAdicionaisParaExibir = custosIndiretosAdicionais.filter(custo => custo.valorMensal > 0);


    // Adiciona os custos predefinidos (somente os filtrados)
    custosPredefinidosParaExibir.forEach((custo, index) => {
        const row = tbody.insertRow();
        const cellDescricao = row.insertCell();
        const cellValorMensal = row.insertCell();
        const cellValorHoraTrabalhada = row.insertCell();
        const cellAcoes = row.insertCell();

        cellDescricao.textContent = custo.descricao;
        cellValorMensal.textContent = formatarMoeda(custo.valorMensal);
        const valorPorHora = custo.valorMensal / horasTrabalhadas;
        cellValorHoraTrabalhada.textContent = formatarMoeda(valorPorHora);

        // Botão Zerar
        const botaoZerar = document.createElement('button');
        botaoZerar.textContent = 'Zerar';
        botaoZerar.onclick = () => zerarCustoIndireto(index, 'predefinido');
        cellAcoes.appendChild(botaoZerar);
    });

    // Adiciona os custos adicionais (somente os filtrados)
    custosAdicionaisParaExibir.forEach((custo) => {
        const row = tbody.insertRow();
        const cellDescricao = row.insertCell();
        const cellValorMensal = row.insertCell();
        const cellValorHoraTrabalhada = row.insertCell();
        const cellAcoes = row.insertCell();

        cellDescricao.textContent = custo.descricao;
        cellValorMensal.textContent = formatarMoeda(custo.valorMensal);
        const valorPorHora = custo.valorMensal / horasTrabalhadas;
        cellValorHoraTrabalhada.textContent = formatarMoeda(valorPorHora);

        // Botão Zerar para custos adicionais
        const botaoZerar = document.createElement('button');
        botaoZerar.textContent = 'Zerar';
        botaoZerar.onclick = () => zerarCustoIndireto(custo.tempIndex, 'adicional'); // Passa o tempIndex
        cellAcoes.appendChild(botaoZerar);
    });
}

function zerarCustoIndireto(indexOuTempIndex, tipo) {
    if (tipo === 'predefinido') {
        // Zera um custo predefinido
        custosIndiretosPredefinidos[indexOuTempIndex].valorMensal = 0;
        // Atualiza o valor no input correspondente
        document.getElementById(`custo-indireto-${indexOuTempIndex}`).value = '0.00';
    } else if (tipo === 'adicional') {
        // Zera um custo adicional
        const custoAdicionalIndex = custosIndiretosAdicionais.findIndex(c => c.tempIndex === indexOuTempIndex);
        if (custoAdicionalIndex !== -1) {
            custosIndiretosAdicionais[custoAdicionalIndex].valorMensal = 0;
        }
    }
    atualizarTabelaCustosIndiretos(); // Atualiza a tabela após zerar
    calcularCustos(); // <-- Importante!
}

function buscarCustosIndiretosCadastrados() {
      const termoBusca = document.getElementById('busca-custo-indireto').value.toLowerCase();
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
    let materiaisDoProduto = [];
    let custoTotalMateriaisProduto = 0;

    for (let i = 0; i < linhasMateriais.length; i++) {
        const linha = linhasMateriais[i];
        const nomeMaterial = linha.cells[0].textContent;
        const tipoMaterial = linha.cells[1].textContent;
        const custoUnitarioMaterial = parseFloat(linha.cells[2].textContent.replace(/[^\d.,-]/g, '').replace('.', '').replace(',', '.'));
        const quantidadeMaterial = parseInt(linha.cells[3].querySelector('input').value);
        const custoTotalMaterial = custoUnitarioMaterial * quantidadeMaterial;

        materiaisDoProduto.push({
            nome: nomeMaterial,
            tipo: tipoMaterial,
            custoUnitario: custoUnitarioMaterial,
            quantidade: quantidadeMaterial,
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
            listaMateriaisHTML += `<li>${material.nome} - ${formatarMoeda(material.custoTotal)} (Qtd: ${material.quantidade})</li>`;
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
            listaMateriaisHTML += `<li>${material.nome} - ${formatarMoeda(material.custoTotal)} (Qtd: ${material.quantidade})</li>`;
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
    document.getElementById('produtos-cadastrados').scrollIntoView({ behavior: 'smooth' });
    document.querySelector('#produtos-cadastrados h2').textContent = 'Editar Produto';
}

function removerProduto(index) {
    produtos.splice(index, 1);
    atualizarTabelaProdutosCadastrados();
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
            });
            resultadosPesquisaDiv.appendChild(resultadoDiv);
        });
    } else {
        resultadosPesquisaDiv.style.display = 'none';
    }
});

function adicionarMaterialNaTabelaProduto(material) {
    const tbody = document.querySelector('#tabela-materiais-produto tbody');
    const row = tbody.insertRow();
    const cellNome = row.insertCell();
    const cellTipo = row.insertCell();
    const cellCustoUnitario = row.insertCell();
    const cellQuantidade = row.insertCell();
    const cellCustoTotal = row.insertCell();
    const cellAcoes = row.insertCell();

    cellNome.textContent = material.nome;
    cellTipo.textContent = material.tipo;
    cellCustoUnitario.textContent = formatarMoeda(material.custoUnitario);

    const inputQuantidade = document.createElement('input');
    inputQuantidade.type = 'number';
    inputQuantidade.value = 1;
    inputQuantidade.min = 1;
    cellQuantidade.appendChild(inputQuantidade);

    inputQuantidade.addEventListener('change', function() {
        const quantidade = parseInt(this.value);
        if (!isNaN(quantidade) && quantidade >= 0) {
            const custoTotal = material.custoUnitario * quantidade;
            cellCustoTotal.textContent = formatarMoeda(custoTotal);
        } else {
            cellQuantidade.value = 1;
            cellCustoTotal.textContent = formatarMoeda(material.custoUnitario);
        }
    });

    const custoTotalInicial = material.custoUnitario * parseInt(inputQuantidade.value);
    cellCustoTotal.textContent = formatarMoeda(custoTotalInicial);

    const botaoRemoverMaterial = document.createElement('button');
    botaoRemoverMaterial.textContent = 'Remover';
    botaoRemoverMaterial.addEventListener('click', function() {
        removerLinhaMaterial(row);
    });
    cellAcoes.appendChild(botaoRemoverMaterial);
}

function removerLinhaMaterial(row) {
    row.remove();
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
            const li = document.createElement('li');
            li.textContent = `${material.nome} (${material.tipo}) - Qtd: ${material.quantidade} - Custo: ${formatarMoeda(material.custoTotal)}`;
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

    calcularPrecoVendaFinal();
}

function calcularPrecoVendaFinal(){
   const margemLucro = parseFloat(document.getElementById('margem-lucro-final').value) / 100 || 0;
    const subtotalTexto = document.getElementById('subtotal').textContent;

    // Converte o subtotal para um número, tratando a formatação de moeda
    const subtotalNumerico = parseFloat(subtotalTexto.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.')) || 0;
    const precoVendaFinal = subtotalNumerico * (1 + margemLucro);
    document.getElementById('total-final').textContent = formatarMoeda(precoVendaFinal);
}

// Event Listeners (ajustado)
document.addEventListener('DOMContentLoaded', () => {

    // Não precisa mais carregar produtos em um <select>

    // Evento para o autocomplete
    document.getElementById('produto-pesquisa').addEventListener('input', buscarProdutosAutocomplete);

    // Eventos para cálculo
    document.getElementById('horas-produto').addEventListener('input', calcularCustos);
     document.getElementById('margem-lucro-final').addEventListener('input', calcularPrecoVendaFinal);
});

//Para esconder o autocomplete quando clica fora.
document.addEventListener('click', function(event) {
    const autocompleteDiv = document.getElementById('produto-resultados');
    const inputPesquisa = document.getElementById('produto-pesquisa');

    if (event.target !== autocompleteDiv && event.target !== inputPesquisa) {
        autocompleteDiv.classList.add('hidden');
    }
});

