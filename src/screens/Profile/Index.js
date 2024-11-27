import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Image, TouchableHighlight } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const Profile = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={styles.headerPart}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="chevron-left" color={'#555454'} size={30} />
          <Text style={styles.headerTitle}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* User Info */}
        <View style={styles.profileContainer}>
          <Image
            source={{ uri: 'https://media.licdn.com/dms/image/v2/D5635AQFU5CrFFlgekw/profile-framedphoto-shrink_400_400/profile-framedphoto-shrink_400_400/0/1715163749577?e=1733310000&v=beta&t=YgENOHuqhhx0JsD7VewPkBmO6oJkLTUWfOCiDzatIpM' }} // Replace with actual user photo URL
            style={styles.profileImage}
          />
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.userDetails}>📱 +123 456 7890</Text>
          <Text style={styles.userDetails}>📧 john.doe@example.com</Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statCount}>150</Text>
            <Text style={styles.statLabel}>Total Flowers Delivered</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statCount}>15</Text>
            <Text style={styles.statLabel}>Today's Deliveries</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={{ padding: 0, height: 58, borderRadius: 0, backgroundColor: '#fff', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', margin: 0 }}>
          <View style={{ padding: 0, width: '30%' }}>
            <TouchableHighlight onPressIn={() => navigation.navigate('Home')} activeOpacity={0.6} underlayColor="#DDDDDD" style={{ backgroundColor: '#fff', padding: 10, flexDirection: 'column', alignItems: 'center' }}>
              <View style={{ alignItems: 'center' }}>
                <MaterialIcons name="delivery-dining" color={'#000'} size={26} />
                <Text style={{ color: '#000', fontSize: 11, fontWeight: '500', height: 17 }}>Delivery</Text>
              </View>
            </TouchableHighlight>
          </View>
          <View style={{ padding: 0, width: '30%' }}>
            <TouchableHighlight onPressIn={() => navigation.navigate('Pickup')} activeOpacity={0.6} underlayColor="#DDDDDD" style={{ backgroundColor: '#fff', padding: 10, flexDirection: 'column', alignItems: 'center' }}>
              <View style={{ alignItems: 'center' }}>
                <FontAwesome5 name="truck-pickup" color={'#000'} size={21} />
                <Text style={{ color: '#000', fontSize: 11, fontWeight: '500', marginTop: 4, height: 17 }}>Pickup</Text>
              </View>
            </TouchableHighlight>
          </View>
          <View style={{ padding: 0, width: '30%' }}>
            <View activeOpacity={0.6} underlayColor="#DDDDDD" style={{ backgroundColor: '#fff', padding: 10, flexDirection: 'column', alignItems: 'center' }}>
              <View style={{ alignItems: 'center', marginTop: 3 }}>
                <Fontisto name="person" color={'#dc3545'} size={20} />
                <Text style={{ color: '#dc3545', fontSize: 11, fontWeight: '500', marginTop: 4, height: 17 }}>Profile</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  headerPart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  profileContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  statCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#28a745',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
});
