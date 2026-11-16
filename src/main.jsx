import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './paginas/Login';
import Solicitacao from './paginas/Solicitacao';
import SolicitarColeta from './paginas/SolicitarColeta';
import './styles.css';

// Login, cadastro e painel da prefeitura são de outra equipe e entram como novas rotas aqui.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/solicitar" element={<SolicitarColeta />} />
        <Route path="/solicitacao/:id" element={<Solicitacao />} />
        <Route path="*" element={<Navigate to="/solicitar" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
