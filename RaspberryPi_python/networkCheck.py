import socket
import time

def is_connected(host="8.8.8.8", port=53, timeout=3):
    """Check network connectivity by attempting to connect to a public DNS server."""
    try:
        socket.setdefaulttimeout(timeout)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect((host, port))
        return True
    except socket.error:
        return False

def wait_for_connection(retry_interval=5):
    """Wait until the network connection is established."""
    while not is_connected():
        print(f"No network connection. Retrying in {retry_interval} seconds...")
        time.sleep(retry_interval)
    print("Network connection established.")

wait_for_connection()