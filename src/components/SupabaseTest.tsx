/**
 * Componente de Teste de Conexão com Supabase
 * @description Use este componente para verificar se a conexão está funcionando
 */

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';

export const SupabaseTest = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionTime, setConnectionTime] = useState<number | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setIsConnected(null);
    setConnectionTime(null);

    const startTime = Date.now();

    try {
      // Testa a conexão usando uma query simples
      const { error } = await supabase()
        .from('customers')
        .select('id')
        .limit(1);

      const endTime = Date.now();
      setConnectionTime(endTime - startTime);

      if (error) {
        throw error;
      }

      setIsConnected(true);
    } catch (err) {
      console.error('Erro ao testar conexão Supabase:', err);
      setIsConnected(false);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Teste de Conexão Supabase
        </CardTitle>
        <CardDescription>
          Verifica se a conexão com o banco de dados está funcionando corretamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da Conexão */}
        <div className="p-4 rounded-md border">
          {loading && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Testando conexão...</span>
            </div>
          )}
          {!loading && isConnected === true && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Conectado ao Supabase com sucesso!</span>
              </div>
              {connectionTime && (
                <p className="text-sm text-green-700 ml-7">
                  Tempo de resposta: {connectionTime}ms
                </p>
              )}
            </div>
          )}
          {!loading && isConnected === false && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-red-600">
                <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Erro de conexão</p>
                  <p className="text-sm mt-1">{error || 'Erro desconhecido'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botão para Retestar */}
        <Button
          onClick={testConnection}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Testar Conexão Novamente
            </>
          )}
        </Button>

        {/* Instruções */}
        <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Instruções</h4>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Certifique-se de que as variáveis de ambiente estão configuradas no arquivo <code className="bg-blue-100 px-1 rounded">.env.local</code></li>
            <li>Verifique se o projeto Supabase existe e está ativo</li>
            <li>Confirme se a chave pública (anon key) está correta</li>
            <li>A tabela <code className="bg-blue-100 px-1 rounded">customers</code> deve existir no banco</li>
          </ul>
        </div>

        {/* Detalhes da Configuração */}
        {!loading && (
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">📋 Detalhes da Configuração</h4>
            <div className="text-xs text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-semibold ${
                  isConnected ? 'text-green-600' : isConnected === false ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {isConnected ? '✅ Conectado' : isConnected === false ? '❌ Erro' : '⏳ Testando'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>URL do Supabase:</span>
                <code className="text-xs bg-gray-100 px-1 rounded truncate max-w-[200px]">
                  {import.meta.env.VITE_SUPABASE_URL || 'Não configurada'}
                </code>
              </div>
              {connectionTime && (
                <div className="flex justify-between">
                  <span>Latência:</span>
                  <span className="font-semibold">{connectionTime}ms</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseTest;