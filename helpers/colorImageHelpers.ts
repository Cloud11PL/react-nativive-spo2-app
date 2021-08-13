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

  const averageColor = `rgb(${Math.floor(red / length)},${Math.floor(
    green / length,
  )},${Math.floor(blue / length)})`;

  return averageColor;
};

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

export { getAverageValue, hexToRGB };
