import { StyleSheet, Image, Platform } from 'react-native';

import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView2 from '@/components/ParallaxScrollView2';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Dimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { LineChart } from 'react-native-chart-kit';
import { View, Text } from 'react-native';
import  { TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';
import { Alert } from 'react-native';
import { auth } from '../(component)/api/firebase';

const screenWidth = Dimensions.get('window').width;

// Define the ChartData type
interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity?: number) => string;
    label?: string;
  }[];
}


export default function TabTwoScreen() {
  const navigation = useNavigation();
  const handleSignOut = async () => {
    await auth.signOut();
    navigation.navigate('(component)/(auth)/login' as unknown as never);

  };
  const [selectedPoint, setSelectedPoint] = useState<{ value: number; x: number; y: number; color: string } | null>(null);

  const Modal = () => {
    Alert.alert(
      "Auth App",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel", // Optional: Adds a "cancel" style to the button
        },
        {
          text: "Logout",
          onPress: handleSignOut, // Calls the handleSignOut function
        },
      ]
    );
  };

  // data variable
  const baseData: ChartData = {
    labels: ['0:00', '3:00', '6:00', '9:00', '12:00', '15:00', '18:00', '21:00', '24:00'],
    datasets: [
      {
        data: [10, 20, 15, 30, 25, 35, 40, 30, 20], // Example base data for dataset 1
        color: (opacity = 0) => `rgba(255, 0, 0, ${opacity})`,
      },
      {
        data: [5, 10, 8, 15, 12, 18, 20, 15, 10], // Example base data for dataset 2
        color: (opacity = 0) => `rgba(60, 179, 113, ${opacity})`,
      },
    ],
  };

  const [data, setData] = useState<ChartData>(baseData);

  const [totalData1, setTotalData1] = useState(
    baseData.datasets[0].data.reduce((sum, value) => sum + value, 0)
  );
  const [totalData2, setTotalData2] = useState(
    baseData.datasets[1].data.reduce((sum, value) => sum + value, 0)
  );

  // function to fetch data from the database, currently simulating data
  useEffect(() => {
    const fetchData = async () => {
      const newData1 = [
        {name: '0:00', value: Math.random() * 70},
        {name: '3:00', value: Math.random() * 10},
        {name: '6:00', value: Math.random() * 10},
        {name: '9:00', value: Math.random() * 100},
        {name: '12:00', value: Math.random() * 10},
        {name: '15:00', value: Math.random() * 10},
        {name: '18:00', value: Math.random() * 100},
        {name: '21:00', value: Math.random() * 100},
        {name: '24:00', value: Math.random() * 100},
      ];

      const newData2 = [
        {name: '0:00', value: Math.random() * 35},
        {name: '3:00', value: Math.random() * 5},
        {name: '6:00', value: Math.random() * 5},
        {name: '9:00', value: Math.random() * 50},
        {name: '12:00', value: Math.random() * 5},
        {name: '15:00', value: Math.random() * 5},
        {name: '18:00', value: Math.random() * 50},
        {name: '21:00', value: Math.random() * 50},
        {name: '24:00', value: Math.random() * 50},
      ];

      const total1 = newData1.reduce((sum, item) =>sum + item.value, 0);
      const total2 = newData2.reduce((sum, item) =>sum + item.value, 0);

      setTotalData1(total1);
      setTotalData2(total2);

      // Transform the data into the format required by the chart
      const transformedData = {
        labels: newData1.map((item) => item.name),
        datasets: [
          {
            data: newData1.map((item) => item.value),
            color: (opacity = 0) => `rgba(255, 0, 0, ${opacity})`,
            area: true,
            stack: 'total'
          },

          {
            data: newData2.map((item) => item.value),
            color: (opacity = 0) => `rgba(60, 179, 113, ${opacity})`,
            area: true,
            stack: 'total'
          },
        ],
      };

      setData(transformedData);
    };
    
    // Simulate fetching data every 2 seconds
    const intervalId = setInterval(fetchData, 6000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    
      <ParallaxScrollView2
        headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
        headerImage={
          <Image
            source={require('@/assets/images/concept403.png')}
            style={styles.reactLogo}
          />
        }>
      <View style={styles.chartWrapper}>
        
        <View style={styles.yAxisLabelContainer}>
          {Array.from('Power').map((char, index) => (
            <Text key={index} style={styles.yAxisLabel}>
              {char}
            </Text>
          ))}
        </View>

        <View style={styles.chartContainer}>
          {/* Line Chart */}
          <LineChart
            data={data}
            width={screenWidth} // Adjust width to account for Y-axis label
            height={300}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 20,
              }
            }}
            bezier
            style={styles.chartStyle}
            onDataPointClick={(data) => {
              setSelectedPoint({
                value: data.value,
                x: data.x,
                y: data.y,
                color: data.dataset.color ? data.dataset.color(1) : 'rgba(0, 0, 0, 0.8)',
              });
            }}
          />

          {/* Tooltip */}
          {selectedPoint && (
            <View
              style={[
                styles.tooltip,
                {
                  top: selectedPoint.y - 30, // Adjust tooltip position above the point
                  left: selectedPoint.x + 10, // Adjust tooltip position to the right of the point
                  backgroundColor: selectedPoint.color,
                },
              ]}
            >
              <Text style={styles.tooltipText}>{`${selectedPoint.value.toFixed(2)} W`}</Text>
            </View>
          )}
          {/* X-Axis Label */}
          <Text style={styles.xAxisLabel}>Time (Hours)</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'red' }]} />
          <Text style={styles.legendText}>Power Consumption (Without System)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'green' }]} />
          <Text style={styles.legendText}>Power Consumption (With System)</Text>
        </View>
      </View>

      {/* Totals Display */}
      <View style={styles.totalsContainer}>
        <Text style={styles.totalText}>Power Used: {totalData2.toFixed(2)} Watts</Text>
        <Text style={styles.totalText}>Power Saved: {(totalData1 - totalData2).toFixed(2)} Watts</Text>
      </View> 

      {/* Data Table */}
      <View style={styles.tableContainer}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableHeader]}>Time</Text>
          <Text style={[styles.tableCell, styles.tableHeader]}>Power Consumption (Without System)</Text>
          <Text style={[styles.tableCell, styles.tableHeader]}>Power Consumption (With System)</Text>
        </View>

        {/* Table Rows */}
        {data.labels.map((label, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{label}</Text>
            <Text style={styles.tableCell}>{data.datasets[0].data[index].toFixed(2)}</Text>
            <Text style={styles.tableCell}>{data.datasets[1].data[index].toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Sign Out Button */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Sign Out</ThemedText>
        <TouchableOpacity style={styles.button} onPress={Modal}>
          <ThemedText type="defaultSemiBold">Sign Out</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView2>
    
    
  );
}

const styles = StyleSheet.create({
  chartWrapper: {
    flexDirection: 'row', // Align Y-axis label and chart horizontally
    alignItems: 'center',
    marginBottom: 0, // Add space for the X-axis label
    paddingLeft: 0,
  },
  chartContainer: {
    flex: 1, // Allow the chart to take up remaining space
    marginLeft: 0, // Add space between the Y-axis label and the chart
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 10,
  },
  reactLogo: {
    height: 300,
    width: screenWidth,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  testStyle: {
    height: 300,
    width: screenWidth,
    left: 0,
  },
  totalsContainer: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  totalText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
  },
  button: {
    padding: 10,
    borderRadius: 8,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    width: 200,
    marginTop: 0,
    marginBottom: 20,
  },
  xAxisLabel: {
    textAlign: 'center',
    marginTop: -25,
    transform: [{ rotate: '-90deg' }],
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  yAxisLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    zIndex: 10, // Ensure it appears above the chart
  },
  legendContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    marginRight: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: '#fff',
  },
  yAxisLabelContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10, // Add space between the label and the chart
  },
  yAxisLabelOverlay: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }], // Rotate the label
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    top: '50%', // Center vertically on the chart
    left: 10, // Position slightly inside the chart
    zIndex: 10, // Ensure it appears above the chart
  },
  tableContainer: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    marginLeft: 5,
    marginRight: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableCell: {
    flex: 1,
    padding: 10,
    textAlign: 'center',
    fontSize: 14,
    color: '#fff',
  },
  tableHeader: {
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    color: '#000',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Semi-transparent background
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12, // Rounded corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
  },
  tooltipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

// function ToolTip({ x, y }: { x: SharedValue<number>; y: SharedValue<number> }) {
//   return <Circle cx={x} cy={y} r={8} color={"grey"} opacity={0.8} />;
// }
