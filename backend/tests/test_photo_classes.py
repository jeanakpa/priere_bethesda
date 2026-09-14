import urllib.request
import json

dummy_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x03\x00\x05\xfe\x02\xfe\xa7\x35\x81\x84\x00\x00\x00\x00IEND\xaeB`\x82'
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = (
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="photo"; filename="test_photo.png"\r\n' +
    'Content-Type: image/png\r\n\r\n'
).encode() + dummy_png + ('\r\n--' + boundary + '--\r\n').encode()

req = urllib.request.Request('http://localhost:5050/api/requests/upload_photo', data=body, headers={'Content-Type': 'multipart/form-data; boundary=' + boundary})
res = urllib.request.urlopen(req)
upload_res = json.loads(res.read().decode())
print('Upload Photo response:', upload_res)
photo_url = upload_res['url']

new_req = {
    'form_type': 'DEMANDE_PRIERE',
    'methode_classe': 'BÉTHEL',
    'conducteur': 'GRAH ADJO ROSE',
    'demandeur_nom': 'Frère KOFFI',
    'details': {
        'date_priere': '2026-09-28',
        'priere_soutien': True,
        'priere_guerison': False,
        'priere_action_grace': False,
        'classe': 'BÉTHEL',
        'conducteur': 'GRAH ADJO ROSE',
        'demandeur': 'Frère KOFFI',
        'sujet': 'Action de grâce pour la famille',
        'photos': [photo_url]
    }
}

req = urllib.request.Request('http://localhost:5050/api/requests', data=json.dumps(new_req).encode(), headers={'Content-Type':'application/json'})
res = urllib.request.urlopen(req)
created = json.loads(res.read().decode())
print('Created request with 28-class selection & photo:')
print('  Code:', created['request']['tracking_code'])
print('  Class:', created['request']['methode_classe'])
print('  Conductor:', created['request']['conducteur'])
print('  Photos:', created['request']['details']['photos'])
