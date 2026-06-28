import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { ApolloClient, InMemoryCache } from '@apollo/client/core/index.js';
import { ApolloProvider } from '@apollo/client/react/index.js';
import { HttpLink } from '@apollo/client/link/http/index.js'; 

const client = new ApolloClient({
  link: new HttpLink({
    uri: import.meta.env.VITE_GRAPHQL_URI || 'https://localhost:6500/graphql',
    // 🌟 MỚI: Tự động đính kèm Token vào mọi yêu cầu mạng gửi lên Backend
    headers: {
      authorization: localStorage.getItem('admin_token') 
        ? `Bearer ${localStorage.getItem('admin_token')}` 
        : '',
    }
  }),
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ApolloProvider client={client}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </ApolloProvider>,
)