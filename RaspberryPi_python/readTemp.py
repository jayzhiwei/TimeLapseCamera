import os
import glob
import time
import json
 
os.system('modprobe w1-gpio')
os.system('modprobe w1-therm')
 
base_dir = '/sys/bus/w1/devices/'
device_folder = glob.glob(base_dir + '28*')[0]
device_file = device_folder + '/w1_slave'
 
def read_temp_raw():
    f = open(device_file, 'r')
    lines = f.readlines()
    f.close()
    return lines
 
def get_room_temp():
    lines = read_temp_raw()
    while lines[0].strip()[-3:] != 'YES':
        time.sleep(0.2)
        lines = read_temp_raw()
    equals_pos = lines[1].find('t=')
    if equals_pos != -1:
        temp_string = lines[1][equals_pos+2:]
        temp_c = float(temp_string) / 1000
        temp_f = temp_c * 9/5 + 32
        return temp_c
    
"""Get the CPU temperature of Raspberry Pi in both Celsius"""
def get_cpu_temp():
    with open("/sys/class/thermal/thermal_zone0/temp", "r") as cpu_temp_file:
        temp_celsius = float(cpu_temp_file.read()) / 1000
    return temp_celsius
'''
while True:
    room_temp = get_room_temp()
    cpu_temp = get_cpu_temp()
    print(f'oom Temperature: {room_temp:.2f}°C')
    print(f'CPU Temperature: {cpu_temp:.2f}°C')
    print('')
    
    temperatures = room_temp,cpu_temp
    json_temperatures = json.dumps(temperatures, indent=2)
    print(json_temperatures)
    time.sleep(1)
'''