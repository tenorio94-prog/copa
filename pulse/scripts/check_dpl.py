import urllib.request, re

resp_alias = urllib.request.urlopen('https://pulse-indol-sigma.vercel.app/')
html_alias = resp_alias.read().decode('utf-8', errors='replace')

resp_direct = urllib.request.urlopen('https://pulse-nw3jgyfe8-lucas-projects-60a50c61.vercel.app/')
html_direct = resp_direct.read().decode('utf-8', errors='replace')

id_alias = re.search(r'data-dpl-id="([^"]+)"', html_alias)
id_direct = re.search(r'data-dpl-id="([^"]+)"', html_direct)

print('=== ALIAS DOMAIN ===')
print('URL: https://pulse-indol-sigma.vercel.app/')
print('data-dpl-id:', id_alias.group(1) if id_alias else 'NOT FOUND')
print('Has BUILD_FIXED:', 'BUILD_FIXED' in html_alias)
print()

print('=== DIRECT DEPLOYMENT ===')
print('URL: https://pulse-nw3jgyfe8-lucas-projects-60a50c61.vercel.app/')
print('data-dpl-id:', id_direct.group(1) if id_direct else 'NOT FOUND')
print('Has BUILD_FIXED:', 'BUILD_FIXED' in html_direct)
print()

print('SAME deployment?', id_alias.group(1) == id_direct.group(1) if id_alias and id_direct else 'UNKNOWN')
