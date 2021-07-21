/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  GestureResponderEvent,
  NativeModules,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import {AreaChart, Grid} from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import {useState, useEffect, useRef} from 'react';
import {Device, BleManager} from 'react-native-ble-plx';
import {RNCamera} from 'react-native-camera';
import {getAllSwatches} from 'react-native-palette';
import {Asset, launchCamera} from 'react-native-image-picker';
// import { getHex } from 'react-native-pixel-color';
// import { getPixelRGBA } from 'react-native-get-pixel';
import {setImage, pickColorAt} from 'react-native-get-pixel-color';

const Section: React.FC<{
  title: string;
}> = ({children, title}) => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
};

const VIEWED_IMAGE_WIDTH = 360;
const VIEWED_IMAGE_HEIGHT = 360;

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const camera = useRef(null);
  const [showImage, setImageStatus] = useState(false);
  const [base64Image, setBase64Image] = useState(null);
  const [processedImage, setProcessedImage] = useState<Asset>(undefined);
  const [color, setColor] = useState(null);
  const [location, setLocation] = useState(null);

  const showCamera = false;
  const launchTheCamera = true;

  const deviceManager = new BleManager();

  useEffect(() => {
    launchCamera(
      {
        mediaType: 'photo',
        includeBase64: true,
        cameraType: 'back',
        maxWidth: 1000,
        maxHeight: 1000,
      },
      response => {
        const {assets} = response;

        if (assets) {
          console.log(assets);
          const imageURL = assets[0].uri?.split('file:///')[1];
          setBase64Image(assets[0].uri);
          setImageStatus(true);
          setProcessedImage(assets[0]);
        }
      },
    );
  }, []);

  const data = [50, 10, 40, 95, -4, -24, 85, 91, 35, 53, -53, 24, 50, -20, -80];

  useEffect(() => {
    if (processedImage && processedImage.base64) {
      setImage(processedImage.base64);
    }
  }, [processedImage]);

  const hexToRGB = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const getAverageValue = async (a, b) => {
    const colorsArray = [];

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const color = await pickColorAt(a + i, processedImage.height - b + j);
        console.log(color);
        colorsArray.push(hexToRGB(color));
      }
    }

    let red = 0;
    let blue = 0;
    let green = 0;
    const length = colorsArray.length;

    console.log(colorsArray);

    colorsArray.forEach(color => {
      red += color.r;
      blue += color.b;
      green += color.g;
    });

    const averageColor = `rgb(${Math.floor(red / length)},${Math.floor(green / length)},${
      Math.floor(blue / length)
    })`;
    console.log(averageColor);
    setColor(averageColor);
  };

  useEffect(async () => {
    if (location && location.a) {
      getAverageValue(location.a, location.b);
    }
  }, [location])

  const handleImagePress = (event: GestureResponderEvent) => {
    const {locationX, locationY} = event.nativeEvent;
    const {height, width, base64} = processedImage;

    const a = (width / VIEWED_IMAGE_WIDTH) * locationY;
    const b = (height / VIEWED_IMAGE_HEIGHT) * locationX;

    console.log(locationX, locationY);
    console.log(a, b);

    setLocation({
      x: locationX,
      y: locationY,
      a,
      b
    });
  };

  setInterval(() => {
    data.length > 0 ? data.shift(Math.floor(Math.random() * 10)) : undefined;
  }, 1000);

  const getImageHeight = () => {
    const {height, width} = processedImage;
    return Math.floor((VIEWED_IMAGE_WIDTH * height) / width);
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        {/* <Header /> */}
        {/* <ImageColorPicker
          imageUrl="https://dummyimage.com/100x100"
          pickerCallback={pickerCallback}
        /> */}
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          {/* <AreaChart
            style={{height: 200}}
            data={data}
            contentInset={{top: 30, bottom: 30}}
            curve={shape.curveNatural}
            animate={true}
            svg={{fill: 'rgba(134, 65, 244, 0.8)'}}>
            <Grid />
          </AreaChart>
          <Section title="Step One">
            Edit <Text style={styles.highlight}>App.js</Text> to change this
            Hellow uwu :333333
          </Section> */}
        </View>
        {showImage && processedImage && (
          <>
            {location && (
              <View
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: 'rgba(154, 224, 255, 0.5)',
                  left: location.x,
                  top: location.y,
                  position: 'absolute',
                  zIndex: 5,
                  borderRadius: 50,
                }}
              />
            )}
            <TouchableWithoutFeedback onPress={handleImagePress}>
              <Image
                style={{
                  width: VIEWED_IMAGE_WIDTH,
                  height: getImageHeight(),
                  borderWidth: 1,
                  borderColor: 'red',
                }}
                source={{uri: processedImage.uri}}
              />
            </TouchableWithoutFeedback>
          </>
        )}
        {color && (
          <View
            style={{
              width: VIEWED_IMAGE_WIDTH,
              height: 50,
              backgroundColor: color,
            }}
          />
        )}
        {showCamera && (
          <View style={styles.container}>
            <RNCamera
              ref={camera}
              style={styles.preview}
              type={RNCamera.Constants.Type.back}
              flashMode={RNCamera.Constants.FlashMode.off}
              captureAudio={false}
              androidCameraPermissionOptions={{
                title: 'Permission to use camera',
                message: 'We need your permission to use your camera',
                buttonPositive: 'Ok',
                buttonNegative: 'Cancel',
              }}
              androidRecordAudioPermissionOptions={{
                title: 'Permission to use audio recording',
                message: 'We need your permission to use your audio',
                buttonPositive: 'Ok',
                buttonNegative: 'Cancel',
              }}
            />
            <View
              style={{flex: 0, flexDirection: 'row', justifyContent: 'center'}}>
              <TouchableOpacity onPress={takePicture} style={styles.capture}>
                <Text style={{fontSize: 14}}> SNAP </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
