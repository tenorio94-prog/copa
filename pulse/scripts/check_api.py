import urllib.request, json

token = 'vcp_6a3Rxj0RoDJX5MP1CjJt5nZluHDNPNYCsABgCQBROpfOhP9dKb4FuDvT'

url = 'https://api.vercel.com/v13/deployments/dpl_38qv9dWoBxeGQKLXYmPPCJgHJ45a'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
resp = urllib.request.urlopen(req)
data = json.load(resp)
print('V13 keys:', list(data.keys()))

url2 = 'https://api.vercel.com/v2/now/deployments/dpl_38qv9dWoBxeGQKLXYmPPCJgHJ45a/files'
req2 = urllib.request.Request(url2, headers={'Authorization': f'Bearer {token}'})
try:
    resp2 = urllib.request.urlopen(req2)
    data2 = json.load(resp2)
    if isinstance(data2, list):
        print(f'{len(data2)} files')
        for f in data2[:5]:
            print(f'  file={f.get("file")} digest={f.get("digest","")[:40]}')
    else:
        print('Type:', type(data2).__name__)
        print(str(data2)[:500])
except Exception as e:
    err_body = e.read() if hasattr(e, 'read') else str(e)
    print(f'Error: {e} - {err_body}')
