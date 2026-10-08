import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, Trash2, Reply, Loader2, CornerDownRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendEmails, templates } from '@/lib/email';

interface Message {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  created_at: string;
  is_read: boolean | null;
  responded_at: string | null;
  response_message: string | null;
}

type Filter = 'open' | 'replied' | 'all';

const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));

const AdminMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('open');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMessages((data as Message[]) || []);
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to load messages', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const patch = (id: string, fields: Partial<Message>) =>
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, ...fields } : m)));

  const markAsRead = async (id: string) => {
    const { error } = await (supabase.from('contact_messages') as any).update({ is_read: true }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to mark message as read', variant: 'destructive' });
      return;
    }
    patch(id, { is_read: true });
  };

  const deleteMessage = async (message: Message) => {
    if (!confirm(`Delete the message from ${message.full_name}? This cannot be undone.`)) return;
    const { error } = await supabase.from('contact_messages').delete().eq('id', message.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete message', variant: 'destructive' });
      return;
    }
    setMessages(prev => prev.filter(m => m.id !== message.id));
    toast({ title: 'Message deleted' });
  };

  const sendReply = async (message: Message) => {
    const reply = replyText.trim();
    if (!reply) return;
    setSending(true);
    try {
      await sendEmails(
        [templates.messageReply({ to: message.email, name: message.full_name, originalSubject: message.subject, reply })],
        'message_reply',
      );

      const { data: { user } } = await supabase.auth.getUser();
      const { data: admin } = await supabase.from('admin_users').select('id').eq('email', (user?.email ?? '').toLowerCase()).maybeSingle();
      const respondedAt = new Date().toISOString();
      const { error: saveErr } = await (supabase.from('contact_messages') as any)
        .update({
          is_read: true,
          responded_at: respondedAt,
          responded_by: (admin as any)?.id ?? null,
          response_message: reply,
        })
        .eq('id', message.id);

      setReplyingTo(null);
      setReplyText('');
      if (saveErr) {
        // The email went out; only the bookkeeping failed. Say so, so nobody replies twice.
        toast({ title: 'Reply emailed, but not marked as answered', description: `${saveErr.message}. Don't send it again.`, variant: 'destructive' });
      } else {
        patch(message.id, { is_read: true, responded_at: respondedAt, response_message: reply });
        toast({ title: 'Reply sent', description: `Emailed ${message.email}` });
      }
    } catch (err: any) {
      toast({ title: 'Reply failed', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const counts = useMemo(() => ({
    open: messages.filter(m => !m.responded_at).length,
    replied: messages.filter(m => !!m.responded_at).length,
    all: messages.length,
  }), [messages]);

  const shown = messages.filter(m =>
    filter === 'all' ? true : filter === 'replied' ? !!m.responded_at : !m.responded_at,
  );

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'open', label: 'Needs reply' },
    { key: 'replied', label: 'Replied' },
    { key: 'all', label: 'All' },
  ];

  return (
    <AdminLayout title="Contact Messages">
      <div className="container mx-auto py-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Contact Messages</h1>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    filter === f.key ? 'bg-diplomatic-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {f.label} <span className="opacity-70">({counts[f.key]})</span>
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={fetchMessages}>Refresh</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loader w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : shown.length > 0 ? (
          <div className="grid gap-6">
            {shown.map((message) => (
              <Card key={message.id} className={message.is_read ? 'bg-gray-50' : 'bg-white border-l-4 border-l-blue-500'}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {message.subject}
                      {!message.is_read && <Badge variant="default" className="ml-2">New</Badge>}
                      {message.responded_at && <Badge variant="secondary" className="ml-2">Replied</Badge>}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Mail className="h-4 w-4 mr-1" />
                      From: {message.full_name} ({message.email}){message.phone ? ` · ${message.phone}` : ''}
                    </CardDescription>
                  </div>
                  <div className="text-sm text-gray-500">{formatDate(message.created_at)}</div>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap mb-4">{message.message}</div>

                  {message.response_message && (
                    <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                      <p className="mb-1 flex items-center gap-1 font-medium text-green-800">
                        <CornerDownRight className="h-4 w-4" /> Replied {message.responded_at ? formatDate(message.responded_at) : ''}
                      </p>
                      <p className="whitespace-pre-wrap text-green-900">{message.response_message}</p>
                    </div>
                  )}

                  {replyingTo === message.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={5}
                        autoFocus
                        placeholder={`Reply to ${message.full_name}…`}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setReplyingTo(null); setReplyText(''); }}>
                          Cancel
                        </Button>
                        <Button size="sm" disabled={sending || !replyText.trim()} onClick={() => sendReply(message)} className="flex items-center gap-1">
                          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Reply className="h-4 w-4" />}
                          Send reply
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      {!message.is_read && (
                        <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => markAsRead(message.id)}>
                          <CheckCircle className="h-4 w-4" />
                          Mark as Read
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => { setReplyingTo(message.id); setReplyText(''); }}
                      >
                        <Reply className="h-4 w-4" />
                        {message.responded_at ? 'Reply again' : 'Reply'}
                      </Button>
                      <Button variant="destructive" size="sm" className="flex items-center gap-1" onClick={() => deleteMessage(message)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-xl font-medium text-gray-600">
                {messages.length === 0 ? 'No messages yet' : 'Nothing here'}
              </p>
              <p className="text-gray-500">
                {messages.length === 0 ? 'Messages from the contact form will appear here' : 'Try another filter'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;
