// --- Configuração do Firebase (Já com suas credenciais) ---
const firebaseConfig = {
  apiKey: "AIzaSyDUbWB7F_4-tQ8K799wylf36IayGWgBuMU",
  authDomain: "diario-de-oracao-268d3.firebaseapp.com",
  projectId: "diario-de-oracao-268d3",
  storageBucket: "diario-de-oracao-268d3.firebasestorage.app",
  messagingSenderId: "561592831701",
  appId: "1:561592831701:web:2a682317486837fd795c5c",
  measurementId: "G-15YHNK7H2B"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// --- Referências aos elementos do DOM ---
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const forgotPasswordLink = document.getElementById('forgot-password');
const messageDiv = document.getElementById('message');


// --- Função para exibir mensagens ---
function showMessage(message, isError = false) {
    messageDiv.textContent = message;
    messageDiv.className = isError ? 'message error' : 'message success';
}

// --- Listener para o formulário de login ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login bem-sucedido.  Redireciona para a página principal.
            window.location.href = '../index.html';
        })
        .catch((error) => {
            // Tratamento de erros de login.
            let errorMessage = 'Erro ao fazer login. Verifique seu e-mail e senha.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'Usuário não encontrado.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Senha incorreta.';
            } else if (error.code === 'auth/invalid-email'){
                errorMessage = 'Email inválido';
            }
            showMessage(errorMessage, true);
        });
});

// --- Listener para o link "Esqueceu a senha?" ---
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    const email = emailInput.value;

    if (!email) {
        showMessage('Por favor, insira seu e-mail no campo acima para redefinir a senha.', true);
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            showMessage(`Um e-mail de redefinição de senha foi enviado para ${email}.`, false);
        })
        .catch((error) => {
            let errorMessage = 'Erro ao enviar e-mail de redefinição de senha.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'Usuário não encontrado.';
            }  else if (error.code === 'auth/invalid-email'){
                 errorMessage = 'Email inválido';
            }
            showMessage(errorMessage, true);
        });
});
