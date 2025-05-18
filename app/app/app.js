import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('unknown');
  const [expandedItem, setExpandedItem] = useState(null);
  
  const [apiUrl, setApiUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState('');

  useEffect(() => {
    const checkApiUrl = async () => {
      try {
        const storedApiUrl = await AsyncStorage.getItem('apiUrl');
        if (storedApiUrl) {
          setApiUrl(storedApiUrl);
          checkServerWithUrl(storedApiUrl);
        } else {
          setShowSettings(true);
          setTempApiUrl('http://192.168.1.100:5000');
        }
      } catch (error) {
        console.error('AsyncStorage hatası:', error);
        setShowSettings(true);
      }
    };

    checkApiUrl();
  }, []);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'İzin Gerekli',
          'Uygulama, kamera ve fotoğraf galerisi erişim izinlerine ihtiyaç duyuyor.'
        );
      }
    })();
  }, []);

  const checkServerWithUrl = async (url) => {
    try {
      setServerStatus('checking');
      const response = await axios.get(url, { timeout: 5000 });
      setServerStatus(response.status === 200 ? 'connected' : 'error');
    } catch (error) {
      setServerStatus('error');
      console.log('Server check failed:', error);
    }
  };

  const checkServerStatus = async () => {
    if (!apiUrl) {
      Alert.alert('API URL Gerekli', 'Lütfen önce ayarlardan API URL\'sini belirleyin.');
      setSettingsVisible(true);
      return;
    }
    checkServerWithUrl(apiUrl);
  };

  const saveApiUrl = async () => {
    try {
      if (!tempApiUrl) {
        Alert.alert('Hata', 'Lütfen geçerli bir API URL\'si girin.');
        return;
      }

      if (!tempApiUrl.startsWith('http://') && !tempApiUrl.startsWith('https://')) {
        Alert.alert('Hata', 'API URL http:// veya https:// ile başlamalıdır.');
        return;
      }

      await AsyncStorage.setItem('apiUrl', tempApiUrl);
      setApiUrl(tempApiUrl);
      setShowSettings(false);
      setSettingsVisible(false);
      checkServerWithUrl(tempApiUrl);
    } catch (error) {
      Alert.alert('Hata', 'API URL kaydedilirken bir hata oluştu: ' + error.message);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
        setResultImage(null);
        setDetectedObjects([]);
      }
    } catch (error) {
      Alert.alert('Hata', 'Kamera kullanılırken bir hata oluştu: ' + error.message);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
        setResultImage(null);
        setDetectedObjects([]);
      }
    } catch (error) {
      Alert.alert('Hata', 'Galeri kullanılırken bir hata oluştu: ' + error.message);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      Alert.alert('Uyarı', 'Lütfen önce bir görüntü seçin.');
      return;
    }

    if (!apiUrl) {
      Alert.alert('API URL Gerekli', 'Lütfen önce ayarlardan API URL\'sini belirleyin.');
      setSettingsVisible(true);
      return;
    }

    if (serverStatus !== 'connected') {
      Alert.alert('Sunucu Hatası', 'API sunucusuna bağlanılamadı. Lütfen sunucu durumunu kontrol edin.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      
      const imageUri = selectedImage.uri;
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: imageUri,
        name: filename || 'upload.jpg',
        type,
      });

      const response = await axios.post(`${apiUrl}/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.data.success) {
        setResultImage(response.data.image);
        setDetectedObjects(response.data.objects);
      } else {
        Alert.alert('Analiz Hatası', response.data.error || 'Görüntü analiz edilirken bir hata oluştu.');
      }
    } catch (error) {
      let errorMessage = 'Sunucu ile iletişim kurulurken bir hata oluştu.';
      
      if (error.response) {
        errorMessage = error.response.data.error || `Sunucu hatası: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.';
      } else {
        errorMessage = error.message || 'İstek oluşturulurken bir hata meydana geldi.';
      }
      
      Alert.alert('Bağlantı Hatası', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatClassName = (className) => {
    if (!className) return 'Bilinmeyen';
    
    return className
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return '#4CAF50';
    if (confidence >= 0.7) return '#2196F3';
    if (confidence >= 0.5) return '#FFC107';
    return '#F44336';
  };

  const toggleItemExpand = (index) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  const resetResults = () => {
    setResultImage(null);
    setDetectedObjects([]);
  };

  const openSettings = () => {
    setTempApiUrl(apiUrl || 'http://');
    setSettingsVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.container}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Domates Yaprak Hastalık Tespiti</Text>
              <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
                <Text style={styles.settingsButtonText}>⚙️</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.serverStatus}>
              <Text style={styles.serverStatusLabel}>Sunucu Durumu: </Text>
              {serverStatus === 'checking' ? (
                <Text style={styles.serverChecking}>Kontrol ediliyor...</Text>
              ) : (
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: serverStatus === 'connected' ? '#4CAF50' : '#F44336' },
                    ]}
                  />
                  <Text style={styles.serverStatusText}>
                    {serverStatus === 'connected' ? 'Bağlı' : 'Bağlantı Hatası'}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.refreshButton} onPress={checkServerStatus}>
                <Text style={styles.refreshButtonText}>Yenile</Text>
              </TouchableOpacity>
            </View>

            {apiUrl ? (
              <View style={styles.apiUrlInfo}>
                <Text style={styles.apiUrlText} numberOfLines={1}>
                  API: {apiUrl}
                </Text>
              </View>
            ) : (
              <View style={styles.apiUrlWarning}>
                <Text style={styles.apiUrlWarningText}>
                  API URL ayarlanmadı. Ayarlar bölümünden ekleyin.
                </Text>
              </View>
            )}

            <View style={styles.imageContainer}>
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.image}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderText}>
                    Lütfen bir domates yaprağı resmi seçin
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={takePhoto}>
                <Text style={styles.buttonText}>Fotoğraf Çek</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={pickImage}>
                <Text style={styles.buttonText}>Galeriden Seç</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.analyzeButton,
                (!selectedImage || !apiUrl || serverStatus !== 'connected') && styles.disabledButton,
              ]}
              onPress={analyzeImage}
              disabled={!selectedImage || !apiUrl || serverStatus !== 'connected'}
            >
              <Text style={styles.analyzeButtonText}>Analiz Et</Text>
            </TouchableOpacity>

            {resultImage && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Analiz Sonuçları</Text>
                
                <Image
                  source={{ uri: `data:image/jpeg;base64,${resultImage}` }}
                  style={styles.resultImage}
                  resizeMode="contain"
                />

                <Text style={styles.detectedTitle}>
                  Tespit Edilen Hastalıklar ({detectedObjects.length})
                </Text>

                {detectedObjects.length === 0 ? (
                  <Text style={styles.noDetections}>Hiçbir hastalık tespit edilmedi.</Text>
                ) : (
                  detectedObjects.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.detectionItem,
                        { borderLeftColor: getConfidenceColor(item.confidence) },
                      ]}
                      onPress={() => toggleItemExpand(index)}
                    >
                      <View style={styles.detectionHeader}>
                        <Text style={styles.detectionName}>{formatClassName(item.class)}</Text>
                        <View
                          style={[
                            styles.confidenceBadge,
                            { backgroundColor: getConfidenceColor(item.confidence) },
                          ]}
                        >
                          <Text style={styles.confidenceText}>
                            {(item.confidence * 100).toFixed(1)}%
                          </Text>
                        </View>
                      </View>

                      {expandedItem === index && (
                        <View style={styles.expandedContent}>
                          <Text style={styles.infoHeader}>Açıklama:</Text>
                          <Text style={styles.infoText}>
                            {item.class === 'healthy'
                              ? 'Sağlıklı yaprak. Herhangi bir hastalık belirtisi bulunmamaktadır.'
                              : `${formatClassName(item.class)} hastalığı tespit edildi. Bu hastalık domates bitkisini etkileyebilir ve verim kaybına neden olabilir.`}
                          </Text>
                          
                          <Text style={styles.infoHeader}>Tedavi Önerisi:</Text>
                          <Text style={styles.infoText}>
                            {item.class === 'healthy'
                              ? 'Tedaviye gerek yoktur. Normal bakım ve sulama devam ettirilebilir.'
                              : 'Bu hastalık için uygun fungisit veya bakteri önleyici ilaçlar kullanılabilir. Enfekte olmuş bitkileri ayırın ve iyi havalandırma sağlayın.'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                )}

                <TouchableOpacity style={styles.newAnalysisButton} onPress={resetResults}>
                  <Text style={styles.newAnalysisText}>Yeni Analiz</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSettings || settingsVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>API URL Ayarları</Text>
            
            <Text style={styles.modalDescription}>
              Domates yaprak hastalık tespiti için API sunucusunun URL adresini girin.
              Bu URL, Flask sunucusunun IP adresi ve portunu içermelidir.
            </Text>
            
            <TextInput
              style={styles.input}
              value={tempApiUrl}
              onChangeText={setTempApiUrl}
              placeholder="örn: http://192.168.1.100:5000"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            
            <View style={styles.modalButtonsContainer}>
              {!showSettings && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setSettingsVisible(false)}
                >
                  <Text style={styles.modalButtonText}>İptal</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={saveApiUrl}
              >
                <Text style={styles.modalButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={loading} transparent={true} animationType="fade">
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Görüntü analiz ediliyor...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    flex: 1,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonText: {
    fontSize: 20,
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  serverStatusLabel: {
    fontSize: 14,
    color: '#757575',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  serverStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  serverChecking: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
  },
  refreshButton: {
    marginLeft: 'auto',
    padding: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  refreshButtonText: {
    fontSize: 12,
    color: '#212121',
  },
  apiUrlInfo: {
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  apiUrlText: {
    fontSize: 12,
    color: '#2E7D32',
  },
  apiUrlWarning: {
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  apiUrlWarningText: {
    fontSize: 12,
    color: '#C62828',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    textAlign: 'center',
    color: '#9e9e9e',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  analyzeButton: {
    backgroundColor: '#FF5722',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#212121',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
    color: '#757575',
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#9e9e9e',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingBox: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    width: 220,
  },
  loadingText: {
    marginTop: 16,
    color: '#212121',
  },
  resultsContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  detectedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noDetections: {
    textAlign: 'center',
    color: '#757575',
    fontStyle: 'italic',
    padding: 16,
  },
  detectionItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  detectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  detectionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  expandedContent: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#757575',
    marginTop: 8,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
    marginBottom: 8,
  },
  newAnalysisButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  newAnalysisText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});