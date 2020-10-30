def lambda_handler(event, context):
    response = event['Records'][0]['cf']['response']
    request = event['Records'][0]['cf']['request']

    '''
        This function updates the response object to include security headers
    '''
    headers = response['headers']
    headers['strict-transport-security'] = [
        {'key': 'Strict-Transport-Security', 'value': 'max-age=63072000; includeSubdomains; preload'}]
    headers['x-content-type-options'] = [
        {'key': 'X-Content-Type-Options', 'value': 'nosniff'}]
    headers['x-frame-options'] = [{'key': 'X-Frame-Options', 'value': 'DENY'}]
    headers['x-xss-protection'] = [
        {'key': 'X-XSS-Protection', 'value': '1; mode=block'}]
    headers['referrer-policy'] = [{'key': 'Referrer-Policy',
                                   'value': 'same-origin'}]

    return response
