/* ==== INÍCIO SEÇÃO - VARIÁVEIS GLOBAIS ==== */
let orcamentos = [];
let pedidos = [];
let numeroOrcamento = 1;
let numeroPedido = 1;
const anoAtual = new Date().getFullYear();
let orcamentoEditando = null; // Variável para controlar se está editando um orçamento
let usuarioLogado = null;  // Variável global para armazenar o usuário logado
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
// ... (restante do seu JavaScript - FUNÇÕES AUXILIARES até o FIM) ...
// ... (sem alterações nessa parte do Javascript, exceto pelas funções de backup e limparPagina abaixo) ...
/* ==== FIM SEÇÃO - FUNÇÕES DE CONTROLE DE PÁGINA ==== */

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