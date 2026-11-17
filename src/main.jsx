import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Cadastro from './paginas/Cadastro';
import Login from './paginas/Login';
import PainelPrefeitura from './paginas/PainelPrefeitura';
import Solicitacao from './paginas/Solicitacao';
import SolicitarColeta from './paginas/SolicitarColeta';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/solicitar" element={<SolicitarColeta />} />
        <Route path="/solicitacao/:id" element={<Solicitacao />} />
        {/* RF03 e RF04: Painel exclusivo para a Prefeitura listar solicitações e gerenciar status */}
        <Route path="/prefeitura" element={<PainelPrefeitura />} />
        <Route path="*" element={<Navigate to="/solicitar" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
