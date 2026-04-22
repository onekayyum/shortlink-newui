"use client";
import { useAuthStore } from '@/lib/store';
import { BookOpenText, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ApiPage() {
  const { user } = useAuthStore();

  const copyText = async (value: string, message: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(message);
  };

  const createEndpoint = 'POST /links/api/create';
  const analyticsEndpoint = 'GET /links/api/analytics';
  const headersExample = '{\n  "x-api-key": "YOUR_API_KEY",\n  "Content-Type": "application/json"\n}';
  const createRequestExample = '{\n  "originalUrl": "https://example.com",\n  "customSlug": "campaign"\n}';
  const createResponseExample = '{\n  "link": {\n    "shortCode": "campaign/Ab12CdE",\n    "uniqueId": "Ab12CdE"\n  }\n}';
  const analyticsResponseExample = '{\n  "totalLinks": 12,\n  "totalClicks": 348\n}';

  return (
    <div className="max-w-4xl space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground">API</h1>
        <p className="text-muted-foreground mt-1">Integrate your account using your API key and endpoint examples.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <BookOpenText className="text-primary" />
          <h3 className="text-lg font-bold">API Documentation</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Your API Key</label>
            <div className="flex gap-2 max-w-lg">
              <input
                type="password"
                value={user?.apiKey || ''}
                disabled
                className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono"
              />
              <button
                onClick={() => copyText(user?.apiKey || '', 'API key copied')}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Headers</h4>
            <pre className="bg-secondary/40 border border-border rounded-xl p-4 text-sm overflow-x-auto">{headersExample}</pre>
            <button onClick={() => copyText(headersExample, 'Headers copied')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium">
              <Copy size={14} /> Copy Headers
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Create Link</h4>
            <code className="inline-block bg-secondary px-2 py-1 rounded text-sm">{createEndpoint}</code>
            <pre className="bg-secondary/40 border border-border rounded-xl p-4 text-sm overflow-x-auto">{createRequestExample}</pre>
            <pre className="bg-secondary/40 border border-border rounded-xl p-4 text-sm overflow-x-auto">{createResponseExample}</pre>
            <button onClick={() => copyText(createEndpoint, 'Create endpoint copied')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium">
              <Copy size={14} /> Copy Endpoint
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Analytics</h4>
            <code className="inline-block bg-secondary px-2 py-1 rounded text-sm">{analyticsEndpoint}</code>
            <pre className="bg-secondary/40 border border-border rounded-xl p-4 text-sm overflow-x-auto">{analyticsResponseExample}</pre>
            <button onClick={() => copyText(analyticsEndpoint, 'Analytics endpoint copied')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium">
              <Copy size={14} /> Copy Endpoint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
