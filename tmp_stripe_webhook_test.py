import os, subprocess, time, requests, json, hmac, hashlib

# Load .env
env = os.environ.copy()
with open('.env') as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        key, value = line.split('=', 1)
        env[key] = value

if 'SUPABASE_URL' not in env and 'VITE_SUPABASE_URL' in env:
    env['SUPABASE_URL'] = env['VITE_SUPABASE_URL']
if 'SUPABASE_ANON_KEY' not in env and 'VITE_SUPABASE_PUBLISHABLE_KEY' in env:
    env['SUPABASE_ANON_KEY'] = env['VITE_SUPABASE_PUBLISHABLE_KEY']

# Start local webhook server
proc = subprocess.Popen([
    '/home/codespace/.deno/bin/deno',
    'run',
    '--allow-net',
    '--allow-env',
    'supabase/functions/stripe-webhook/index.ts'
], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
try:
    time.sleep(3)
    print('started webhook pid', proc.pid)

    url = env['VITE_SUPABASE_URL']
    anon = env['VITE_SUPABASE_PUBLISHABLE_KEY']
    service = env['SUPABASE_SERVICE_ROLE_KEY']
    email = 'xwy16923@163.com'
    password = '123456'

    signin = requests.post(
        f'{url}/auth/v1/token?grant_type=password',
        headers={'apikey': anon, 'Content-Type': 'application/json'},
        json={'email': email, 'password': password}
    )
    print('signin', signin.status_code, signin.text[:400])
    if signin.status_code != 200:
        raise SystemExit('sign-in failed')

    token = signin.json().get('access_token')
    if not token:
        raise SystemExit('no access token')

    # Create checkout_sessions row with service role
    order_number = 'PA-WEBHOOK-' + str(int(time.time()))
    row = {
        'user_id': signin.json().get('user', {}).get('id'),
        'order_number': order_number,
        'items': [{'productId':'test-prod','name':'Test Product','price':100.0,'quantity':1,'variant':'Standard'}],
        'shipping_name':'Test User',
        'shipping_email':'test-user@example.com',
        'shipping_phone':'1234567890',
        'shipping_address':{'province':'Auckland','city':'Auckland','district':'Central','address':'1 Test St'},
        'currency':'NZD',
        'subtotal':100.00,
        'discount':0.00,
        'shipping_cost':25.00,
        'total':125.00,
        'promo_code':None
    }
    insert = requests.post(
        f'{url}/rest/v1/checkout_sessions',
        headers={'apikey': service, 'Authorization': f'Bearer {service}', 'Content-Type': 'application/json', 'Prefer': 'return=representation'},
        json=row
    )
    print('insert row', insert.status_code, insert.text[:500])
    if insert.status_code not in (200, 201):
        raise SystemExit('insert failed')
    inserted = insert.json()[0]
    print('inserted id', inserted['id'])

    # Simulate Stripe webhook event
    stripe_secret = env['STRIPE_WEBHOOK_SECRET']
    payload = {
        'id': 'evt_test_webhook_' + str(int(time.time())),
        'object': 'event',
        'type': 'checkout.session.completed',
        'data': {
            'object': {
                'id': 'cs_test_dummy',
                'payment_intent': 'pi_test_dummy',
                'metadata': {
                    'checkout_session_id': inserted['id'],
                    'order_number': order_number
                }
            }
        }
    }
    body = json.dumps(payload)
    timestamp = str(int(time.time()))
    signed_payload = f'{timestamp}.{body}'.encode('utf-8')
    signature = hmac.new(stripe_secret.encode('utf-8'), signed_payload, hashlib.sha256).hexdigest()
    sig_header = f't={timestamp},v1={signature}'

    r = requests.post(
        'http://127.0.0.1:8000/',
        data=body,
        headers={'Content-Type': 'application/json', 'Stripe-Signature': sig_header}
    )
    print('webhook resp', r.status_code, r.text)

    check = requests.get(
        f'{url}/rest/v1/orders?select=*&order_number=eq.{order_number}',
        headers={'apikey': service, 'Authorization': f'Bearer {service}'}
    )
    print('orders query', check.status_code, check.text[:1000])

finally:
    proc.kill()
    out, err = proc.communicate(timeout=5)
    print('Deno stdout:', out)
    print('Deno stderr:', err)
