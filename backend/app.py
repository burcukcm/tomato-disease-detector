from flask import Flask, request, jsonify
from flask_cors import CORS
import io
from PIL import Image
import base64
import numpy as np
import traceback
import sys

app = Flask(__name__)
CORS(app)  # Cross-Origin isteklerine izin ver

# YOLO modelini yükleme
try:
    print("YOLOv12 ortamı hazırlanıyor...")

    # İlk olarak çalışma dizinini değiştirin (YOLO modülü buradan yüklenecek)
    # Not: yolov12 repo klasörünün tam yolunu belirtin
    yolov12_path = "E:/projee/pythonProject16/yolov12"  # Kendi yolunuzu buraya yazın

    # YOLOv12 klasörünü Python yoluna ekleyin (eğer pip install -e . çalıştırmadıysanız)
    sys.path.insert(0, yolov12_path)

    # Şimdi ultralytics'i içe aktarın
    from ultralytics import YOLO

    # Modeli yükle
    print("Model yükleniyor...")
    model_path = "yolov12_model_best.pt"  # Model dosyasının tam yolunu belirtin
    model = YOLO(model_path)
    print("Model başarıyla yüklendi!")


    # Her sınıf için en yüksek güven skorlu nesneyi seçme fonksiyonu
    def filter_highest_confidence(results):
        filtered_results = []

        for r in results:
            # Create a new Results object
            filtered_result = r.new()

            # Tespit edilen nesneleri kontrol et
            if len(r.boxes) > 0:
                # Sınıf ID'leri, güven skorları ve kutu koordinatları
                class_ids = r.boxes.cls.cpu().numpy()
                confidence_scores = r.boxes.conf.cpu().numpy()

                # Benzersiz sınıfları bul
                unique_classes = np.unique(class_ids)

                # Her sınıf için en yüksek güvenli nesneyi bul
                filtered_indices = []
                for cls in unique_classes:
                    # Bu sınıfa ait tüm indeksleri bul
                    class_indices = np.where(class_ids == cls)[0]
                    # Bu sınıftaki en yüksek güven skoruna sahip nesneyi bul
                    highest_conf_idx = class_indices[np.argmax(confidence_scores[class_indices])]
                    # En yüksek güven skorlu nesnenin indeksini ekle
                    filtered_indices.append(highest_conf_idx)

                # Add the filtered boxes to the new Results object
                filtered_result.boxes = r.boxes[filtered_indices]

                # Copy other relevant attributes if they exist
                if hasattr(r, 'masks') and r.masks is not None:
                    filtered_result.masks = r.masks[filtered_indices] if len(filtered_indices) > 0 else None
                if hasattr(r, 'keypoints') and r.keypoints is not None:
                    filtered_result.keypoints = r.keypoints[filtered_indices] if len(filtered_indices) > 0 else None
                if hasattr(r, 'obb') and r.obb is not None:
                    filtered_result.obb = r.obb[filtered_indices] if len(filtered_indices) > 0 else None

            filtered_results.append(filtered_result)

        return filtered_results

except Exception as e:
    print(f"Model yüklenirken hata oluştu: {e}")
    traceback.print_exc()
    model = None


@app.route('/predict', methods=['POST'])
def predict():
    # Gelen istekte 'image' dosyası var mı kontrol et
    if 'image' not in request.files:
        return jsonify({'error': 'Görüntü bulunamadı'}), 400

    # Modelin doğru yüklenip yüklenmediğini kontrol et
    if model is None:
        return jsonify({'error': 'Model yüklenemedi. Lütfen sunucu loglarını kontrol edin.'}), 500

    # Görüntüyü al
    file = request.files['image']
    img_bytes = file.read()

    try:
        # Görüntüyü yükle
        img = Image.open(io.BytesIO(img_bytes))

        # YOLOv12 ile nesne algılama
        results = model(img)

        # İsteğe bağlı: Her sınıf için en yüksek güven skorlu nesneyi seç
        # Aşağıdaki satırı yorum satırından çıkarın eğer filtreleme istiyorsanız
        results = filter_highest_confidence(results)

        # Sonuç görüntüsünü oluştur
        result_img = results[0].plot()
        result_pil = Image.fromarray(result_img)

        # Görüntüyü base64'e dönüştür
        buffered = io.BytesIO()
        result_pil.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        # Tespit edilen nesneleri al
        detected_objects = []

        for box in results[0].boxes:
            # Sınıf adını al
            cls_id = int(box.cls.item())
            cls_name = results[0].names[cls_id]

            # Güven değerini al
            conf = float(box.conf.item())

            # Koordinatları al
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detected_objects.append({
                "class": cls_name,
                "confidence": conf,
                "box": [int(x1), int(y1), int(x2), int(y2)]
            })

        return jsonify({
            'success': True,
            'image': img_str,
            'objects': detected_objects
        })

    except Exception as e:
        print(f"Tahmin sırasında hata: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/', methods=['GET'])
def home():
    return """
    <html>
        <head>
            <title>YOLOv12 API</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { color: #333; }
                form { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                button { background: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
                img { max-width: 100%; }
                #result { margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>YOLOv12 Domates Yaprak Hastalık Tespiti API</h1>
            <p>Bir görüntü yükleyin ve yaprak hastalığı tespiti sonucunu alın.</p>

            <form id="upload-form">
                <input type="file" name="image" accept="image/*" required>
                <button type="submit">Analiz Et</button>
            </form>

            <div id="result"></div>

            <script>
                document.getElementById('upload-form').addEventListener('submit', async function(e) {
                    e.preventDefault();

                    const resultDiv = document.getElementById('result');
                    resultDiv.innerHTML = '<p>Analiz ediliyor...</p>';

                    const formData = new FormData(this);

                    try {
                        const response = await fetch('/predict', {
                            method: 'POST',
                            body: formData
                        });

                        const data = await response.json();

                        if (data.success) {
                            let objectsList = '';
                            data.objects.forEach(obj => {
                                objectsList += `<li>${obj.class}: %${(obj.confidence * 100).toFixed(2)}</li>`;
                            });

                            resultDiv.innerHTML = `
                                <h2>Sonuç:</h2>
                                <img src="data:image/jpeg;base64,${data.image}" alt="Analiz Sonucu">
                                <h3>Tespit Edilen Nesneler:</h3>
                                <ul>${objectsList || '<li>Hiçbir nesne tespit edilmedi</li>'}</ul>
                            `;
                        } else {
                            resultDiv.innerHTML = `<p style="color: red;">Hata: ${data.error}</p>`;
                        }
                    } catch (error) {
                        resultDiv.innerHTML = `<p style="color: red;">İstek sırasında hata: ${error.message}</p>`;
                    }
                });
            </script>
        </body>
    </html>
    """


if __name__ == '__main__':
    # API'yi başlat (0.0.0.0 tüm ağlara açar)
    app.run(host='0.0.0.0', port=5000, debug=True)