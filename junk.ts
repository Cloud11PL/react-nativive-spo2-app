// {showCamera && (
//   <View style={styles.container}>
//     <RNCamera
//       ref={camera}
//       style={styles.preview}
//       type={RNCamera.Constants.Type.back}
//       flashMode={RNCamera.Constants.FlashMode.off}
//       captureAudio={false}
//       androidCameraPermissionOptions={{
//         title: 'Permission to use camera',
//         message: 'We need your permission to use your camera',
//         buttonPositive: 'Ok',
//         buttonNegative: 'Cancel',
//       }}
//       androidRecordAudioPermissionOptions={{
//         title: 'Permission to use audio recording',
//         message: 'We need your permission to use your audio',
//         buttonPositive: 'Ok',
//         buttonNegative: 'Cancel',
//       }}
//     />
//     <View
//       style={{flex: 0, flexDirection: 'row', justifyContent: 'center'}}>
//       <TouchableOpacity onPress={takePicture} style={styles.capture}>
//         <Text style={{fontSize: 14}}> SNAP </Text>
//       </TouchableOpacity>
//     </View>
//   </View>
// )}


// {showImage && processedImage && (
//   <>
//     {location && (
//       <View
//         style={{
//           width: 10,
//           height: 10,
//           backgroundColor: 'rgba(154, 224, 255, 0.5)',
//           left: location.x,
//           top: location.y,
//           position: 'absolute',
//           zIndex: 5,
//           borderRadius: 50,
//         }}
//       />
//     )}
//     <TouchableWithoutFeedback onPress={handleImagePress}>
//       <Image
//         style={{
//           width: VIEWED_IMAGE_WIDTH,
//           height: getImageHeight(),
//           borderWidth: 1,
//           borderColor: 'red',
//         }}
//         source={{uri: processedImage.uri}}
//       />
//     </TouchableWithoutFeedback>
//   </>
// )}

//     // launchCamera(
//     //   {
//     //     mediaType: 'photo',
//     //     includeBase64: true,
//     //     cameraType: 'back',
//     //     maxWidth: 1000,
//     //     maxHeight: 1000,
//     //   },
//     //   response => {
//     //     const {assets} = response;
//     //     if (assets) {
//     //       console.log(assets);
//     //       const imageURL = assets[0].uri?.split('file:///')[1];
//     //       setBase64Image(assets[0].uri);
//     //       setImageStatus(true);
//     //       setProcessedImage(assets[0]);
//     //     }
//     //   },
//     // );

//     useEffect(() => {
//       if (processedImage && processedImage.base64) {
//         setImage(processedImage.base64);
//       }
//     }, [processedImage]);
  
//     const locationChangedHandler = async (a, b) => {
//       const averageColor = await getAverageValue(a, b);
//       setColor(averageColor);
//     };
  
//     useEffect(async () => {
//       if (location && location.a) {
//         locationChangedHandler(location.a, location.b);
//       }
//     }, [location]);
  
//     const handleImagePress = (event: GestureResponderEvent) => {
//       const {locationX, locationY} = event.nativeEvent;
//       const {height, width, base64} = processedImage;
  
//       const a = (width / VIEWED_IMAGE_WIDTH) * locationY;
//       const b = (height / VIEWED_IMAGE_HEIGHT) * locationX;
  
//       console.log(locationX, locationY);
//       console.log(a, b);
  
//       setLocation({
//         x: locationX,
//         y: locationY,
//         a,
//         b,
//       });
//     };