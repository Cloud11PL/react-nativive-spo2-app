import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  GestureResponderEvent,
  NativeModules,
} from 'react-native';
import {Button, ListItem, Text} from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome5';

import {
  Colors,
  DebugInstructions,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import {useState, useEffect, useRef} from 'react';
import {Device, BleManager, Characteristic} from 'react-native-ble-plx';
import base64 from 'react-native-base64';
import {allPass, isEmpty, isNil} from 'ramda';

import MQTT from 'sp-react-native-mqtt';

import type {Device as DeviceType} from 'react-native-ble-plx';
import {manager} from './BLEManager';

import {getAverageValue, hexToRGB} from './helpers/colorImageHelpers';
import {Divider} from 'react-native-elements/dist/divider/Divider';
import {
  HR_UUID,
  SPO_UUID,
  PULSE_SERVICE,
  MEASUREMENT_CHAR,
  DEVICE_NAME
} from './consts/consts';

const MQTT_CONFIG = {
  host: process.env.HOST,
  port: process.env.PORT,
  user: process.env.USER,
  pass: process.env.PASS
}

const myStorage = {
  setItem: (key, item) => {
    myStorage[key] = item;
  },
  getItem: key => myStorage[key],
  removeItem: key => {
    delete myStorage[key];
  },
};

const ScannedDevicesList: React.FC<{
  devices: DeviceType[];
  pressHandler: (device: DeviceType) => void;
}> = ({devices, pressHandler}) => {
  return (
    <View style={{marginTop: 10}}>
      <Text style={{marginBottom: 5}}>Devices found:</Text>
      {devices.length > 0 &&
        devices.map(device => (
          <ListItem onPress={() => pressHandler(device)} key={device.id}>
            <>
              <Icon name="microchip" style={{marginRight: 10}}></Icon>
              <ListItem.Title style={{marginRight: 10}}>
                {device.name}
              </ListItem.Title>
              <ListItem.Subtitle>{device.id}</ListItem.Subtitle>
            </>
          </ListItem>
        ))}
    </View>
  );
};

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    height: 900,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
  };

  const [isScanning, setScanningStatus] = useState(false);
  const [spoDevice, setSpoDevice] = useState<Device>(null);
  const [deviceInfo, setDeviceInfo] = useState({
    deviceId: '',
    serviceUUID: '',
    characteristicsUUID: '',
    notificationReceiving: false,
    device: undefined,
    id: '',
  });
  const [receivedHRSData, setHRSData] = useState({
    hr: undefined,
    spo: undefined,
  });
  const [bleHRval, setBleHRval] = useState(null);

  const [spoChar, setSpoChar] = useState<Characteristic>(undefined);
  const [hrChar, setHrChar] = useState<Characteristic>(undefined);
  const [isDeviceConnected, setDeviceConnected] = useState(false);

  manager.onDeviceDisconnected(deviceInfo.id, () => {
    setBleHRval(null);
    setSpoChar(null);
    setHrChar(null);
    setSpoDevice(null);
    setScanningStatus(false);
  });

  const disconnectAndDestroy = () => {
    manager.cancelDeviceConnection(deviceInfo.id);
    setDeviceConnected(false);
    const dataString = `${DEVICE_NAME};disconnect`;
    mqttClient.publish('init', dataString, 0, false);
  };

  useEffect(() => {
    // return () => disconnectAndDestroy();
  }, []);

  const [mqttConected, setMqttConnected] = useState(false);
  const [mqttClient, setMqttClient] = useState(null);

  useEffect(async () => {
    const client = await MQTT.createClient({
      uri: `mqtt://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`,
      clientId: 'your_client_id',
      tsl: true,
      user: MQTT_CONFIG.user,
      pass: MQTT_CONFIG.pass,
      auth: true,
      automaticReconnect: true,
      clean: true,
    });

    client.on('error', function (msg) {
      console.log('mqtt.event.error', msg);
    });

    client.on('message', function (msg) {
      console.log('mqtt.event.message', msg);
    });

    client.on('connect', function () {
      console.log('connected');
      setMqttConnected(true);

      client.subscribe('INIT', 0);
    });

    client.connect();

    setMqttClient(client);
  }, []);

  const handleDevicePress = (device: Device) => {
    console.log(device.id);
    setDeviceInfo(({serviceUUID, ...rest}) => ({
      serviceUUID: device.serviceUUIDs[0],
      id: device.id,
      ...rest,
    }));

    manager.connectToDevice(device.id, {autoConnect: false}).then(device => {
      setSpoDevice(device);
      (async () => {
        const dataString = `${DEVICE_NAME};connected`;
        mqttClient.publish('init', dataString, 0, false);

        const charList = [];
        const services = await device.discoverAllServicesAndCharacteristics();
        services.services().then(newServices => {
          newServices.forEach(service => {
            console.log(service);

            service.characteristics().then(char => {
              console.log(char);

              char.forEach(c => {
                if (c.isNotifiable) {
                  const {uuid} = c;
                  console.log(uuid, HR_UUID);
                  console.log(uuid, SPO_UUID);
                  switch (uuid) {
                    case SPO_UUID:
                      setSpoChar(c);
                      break;
                    case HR_UUID:
                      setHrChar(c);
                      break;
                    default:
                      undefined;
                  }
                }
              });
              setDeviceConnected(true);
            });
          });
        });

        setDeviceInfo(({serviceUUID, ...info}) => ({
          deviceId: device.id,
          serviceUUID,
          ...device,
        }));
      })();
    });
  };

  const status = {
    ok: 'ok',
    invalid: 'invalid',
    error: 'error',
  };

  const sendDataPacket = ({hr, spo}) => {
    const packetStatus = spo > 0 && hr > 0 ? status.ok : status.invalid;

    const dataString = `SPO:${spo},HR:${hr},status:${packetStatus}`;

    mqttClient.publish('device', dataString, 0, false);
  };

  useEffect(() => {
    if (!isNil(receivedHRSData.hr) && !isNil(receivedHRSData.spo)) {
      sendDataPacket(receivedHRSData);
    }
  }, [receivedHRSData]);

  useEffect(() => {
    let newSpo, newHr;
    if (spoChar) {
      spoChar.monitor((err, char) => {
        if (err) console.log(err);

        const value = base64.decode(char?.value);

        if (value.length <= 2) {
          const valueOne = String(value[1]).charCodeAt(); // ok val
          const valueTwo = String(value[0]).charCodeAt();

          console.log('SPO', char);

          console.log('SPO', valueOne, valueTwo);
          setHRSData(({spo, ...rest}) => ({
            spo: valueOne,
            ...rest
          }));
          newSpo = valueOne;
        }
      });
    }

  }, [spoChar]);

  useEffect(() => {
    if (hrChar) {
      hrChar.monitor((err, char) => {
        if (err) console.log(err);

        const value = base64.decode(char?.value);

        if (value.length <= 2) {
          const valueOne = String(value[1]).charCodeAt(); // ok val
          const valueTwo = String(value[0]).charCodeAt();
          
          // double checl
          const uuid = char?.uuid;

          console.log('HR', char);

          console.log('HR', valueOne, valueTwo, char?.uuid);
          setHRSData(({hr, ...rest}) => ({
            hr: valueOne,
            ...rest
          }));
          newHr = valueOne;
        }
      });
    }
  }, [hrChar]);

  const getImageHeight = () => {
    const {height, width} = processedImage;
    return Math.floor((VIEWED_IMAGE_WIDTH * height) / width);
  };

  const [scannedDevices, setScannedDevices] = useState<Device[]>([]);

  const scanDevices = () => {
    console.log('scann');
    setScanningStatus(status => !status);

    if (!isScanning) {
      if (!isEmpty(scanDevices)) setScannedDevices([]);

      manager.startDeviceScan(null, null, (error, device) => {
        if (error) return;

        if (device.name === 'Heart Rate SpO') {
          setScannedDevices(sd => [...sd, device]);
          manager.stopDeviceScan();
          setScanningStatus(false);
        }
      });
    } else {
      manager.stopDeviceScan();
    }
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <View style={{marginBottom: 10}}>
        <Text
          style={{
            color: isDarkMode ? Colors.lighter : Colors.darker,
            marginBottom: 10,
          }}>
          Server connection status: {mqttConected ? '🟢' : '🔴'}
        </Text>
      </View>
      {isDeviceConnected && <DeviceInfoViewer device={spoDevice} />}

      <View style={{alignSelf: 'stretch'}}>
        {isDeviceConnected && (
          <Button
            style={{height: 50, backgroundColor: 'red'}}
            onPress={disconnectAndDestroy}
            title="Disconnect"
          />
        )}

        {!isDeviceConnected && (
          <Button
            style={{height: 50}}
            onPress={scanDevices}
            title={isScanning ? 'Scanning...' : 'Scan for devices'}
          />
        )}

        {!isEmpty(scannedDevices) && !isDeviceConnected && (
          <ScannedDevicesList
            devices={scannedDevices}
            pressHandler={handleDevicePress}
          />
        )}
      </View>

      {isDeviceConnected && (
        <View style={infoViewStyle.wrapper}>
          <View style={infoViewStyle.infoWrapper}>
            <Icon name="wave-square" style={infoViewStyle.iconStyle} />
            <Text style={infoViewStyle.infoTitle}>HR Value {receivedHRSData ? receivedHRSData.hr : '--'}</Text>
          </View>
          <Divider />
          <View style={infoViewStyle.infoWrapper}>
            <Icon name="water" style={infoViewStyle.iconStyle} />
            <Text style={infoViewStyle.infoTitle}>Spo Value {receivedHRSData ? receivedHRSData.spo : '--'}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const infoViewStyle = StyleSheet.create({
  wrapper: {
    backgroundColor: 'white',
    padding: 5,
    marginTop: 10,
    display: 'flex',
  },
  infoWrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    // gap: 5
  },
  iconStyle: {
    alignSelf: 'flex-start',
  },
  infoTitle: {
    fontWeight: '300',
    fontSize: 15,
    alignSelf: 'flex-start',
  },
  infoContent: {
    alignSelf: 'flex-end',
    fontSize: 20,
  },
});

type DeviceInfoViewerProps = {
  device: Device;
};

const DeviceInfoViewer: React.FC<DeviceInfoViewerProps> = ({device}) => {
  const {id, name, manufacturerData, localName} = device;
  return (
    <View
      style={{
        alignSelf: 'stretch',
        marginBottom: 10,
      }}>
      <Text h4 style={{color: 'white'}}>Device info</Text>
      <Text style={{color: 'white'}}>ID: {id}</Text>
      <Text style={{color: 'white'}}>Name: {name}</Text>
      <Text style={{color: 'white'}}>Manufacturer: {manufacturerData}</Text>
      <Text style={{color: 'white'}}>Local name: {localName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
    height: 300,
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
  },
  dot: {
    width: 5,
    height: 5,
    backgroundColor: 'blue',
    borderRadius: 100,
  },
});

export default App;
