import os
from google.cloud import speech
from google.cloud import storage
import pandas as pd
import moviepy.editor as moviepy
import argparse
from nltk.corpus import webtext
from nltk.corpus import brown
from nltk.collocations import BigramCollocationFinder
from nltk.metrics import BigramAssocMeasures
from nltk.collocations import TrigramCollocationFinder
from nltk.metrics import TrigramAssocMeasures
from nltk.collocations import QuadgramCollocationFinder
import pdb

# Función para transcribir un archivo de audio local y obtener los desplazamientos de tiempo de las palabras
def transcribe_local_audio_with_word_time_offsets(audio_path: str) -> speech.RecognizeResponse:
    # Crear un cliente para el servicio de Google Cloud Speech-to-Text
    client = speech.SpeechClient()

    # Configurar el objeto de audio de reconocimiento
    audio = speech.RecognitionAudio(uri=audio_path)
    
    # Configurar los parámetros de reconocimiento, incluyendo el idioma y la habilitación de los desplazamientos de tiempo de las palabras
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=48000,
        language_code="en-US",
        enable_word_time_offsets=True,
        audio_channel_count=1,  # Especificar el número de canales de audio (en este caso, 2 para estéreo)
)
    

    # Iniciar la operación de reconocimiento de larga duración
    operation = client.long_running_recognize(config=config, audio=audio)

    # Esperar a que la operación se complete y obtener el resultado
    print("Esperando a que la operación se complete...")
    result = operation.result(timeout=90)

    return result
    
def identify_ngrams(word_list):
    print("word list")
    word_list = [word_in.word.lower() for word_in in word_list]
    print(word_list)
    
    # # Load the Brown Corpus
    brown_words = brown.words()

    # Create a BigramCollocationFinder object with the Brown Corpus
    finder = BigramCollocationFinder.from_words(brown_words)
    print(finder)

    # Filter bigrams to only include those present in the given word list
    finder.apply_word_filter(lambda w: w.lower() not in word_list)
    
    finder.apply_freq_filter(3)

    # Get the frequency ranks of bigrams
    bigram_freq_ranking = sorted(finder.ngram_fd.keys(), key=lambda item: item[1], reverse=True)
    
    bigram_list = [' '.join(bg) for bg in bigram_freq_ranking]

    print(bigram_freq_ranking)
    print(bigram_list)
    tcf = TrigramCollocationFinder.from_words(brown_words)
    tcf.apply_word_filter(lambda w: w.lower() not in word_list)
    tcf.apply_freq_filter(3)
    trigram_freq_ranking = sorted(tcf.ngram_fd.keys(), key=lambda item: item[1], reverse=True)
    trigram_list = [' '.join(tg) for tg in trigram_freq_ranking]
    print(trigram_list)
    
    qcf = QuadgramCollocationFinder.from_words(brown_words)
    qcf.apply_word_filter(lambda w: w.lower() not in word_list)
    qcf.apply_freq_filter(2)
    quadgram_freq_ranking = sorted(qcf.ngram_fd.keys(), key=lambda item: item[1], reverse=True)
    quadgram_list = [' '.join(qg) for qg in quadgram_freq_ranking]
    print(quadgram_list)
    
    
    # pdb.set_trace()
    return bigram_list, trigram_list, quadgram_list

# Función principal
def main(bucket_name, prefix, output_folder):
    # # Ruta de la carpeta que contiene los archivos de audio
    # folder_path = "/Users/lab/Library/Mobile Documents/com~apple~CloudDocs/python_s2t/audios"
    #
    # # Ruta de la carpeta donde se guardarán las hojas de Excel de salida
    # output_folder = "/Users/lab/Library/Mobile Documents/com~apple~CloudDocs/python_s2t/outcome"
    
    
    storage_client = storage.Client()   
    blobs = storage_client.list_blobs(bucket_name, prefix = prefix)
    b = [blob.name for blob in blobs if blob.name.endswith('.wav')]
    
    # Crear la carpeta de salida si no existe
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Iterar sobre cada archivo .wav en la carpeta
    for file_name in b:
        if file_name.endswith(".wav"):
            
            # Obtener la ruta completa del archivo de audio
            # audio_path = os.path.join(input_folder, file_name)
        
            audio_path = os.path.join('gs://semantic-data',file_name)
        
            # Realizar la transcripción de audio y obtener los resultados
            result = transcribe_local_audio_with_word_time_offsets(audio_path)
            print(result)
            # Convertir el resultado a un DataFrame de pandas
            rows = []
            for res in result.results:
                alternative = res.alternatives[0]
                bigram_list, trigram_list, quadgram_list = identify_ngrams(alternative.words)
                for word_info in alternative.words:
                    word = word_info.word
                    start_time = word_info.start_time.total_seconds()
                    end_time = word_info.end_time.total_seconds()
                    confidence = alternative.confidence
                    if len(rows)>0 and rows[-1][0].count(' ') < 3:
                        if start_time == rows[-1][2]:
                            check_wd = rows[-1][0] + " "+word
                            spaces_ct = check_wd.count(' ')
                            if (spaces_ct == 1 and check_wd in bigram_list) or  (spaces_ct == 2 and check_wd in trigram_list) or (spaces_ct == 3 and check_wd in quadgram_list):
                                rows[-1][0]+= " "+word
                                rows[-1][2] = end_time
                            else:
                                rows.append([word, start_time, end_time, confidence])
                        else:
                            rows.append([word, start_time, end_time, confidence])
                    else:
                        rows.append([word, start_time, end_time, confidence])
                    

            df = pd.DataFrame(rows, columns=["Word", "Start_time", "End_time", "Confidence"])

            # Escribir el DataFrame en un archivo de Excel
            filename_xl = file_name[len(prefix):]
            output_path = os.path.join(output_folder, f"{os.path.splitext(filename_xl)[0]}.xlsx")
            df.to_excel(output_path, index=False)

            print(f"Transcripción para {file_name} guardada en {output_path}")
            


# Ejecutar la función principal si este script es el archivo principal que se está ejecutando
if __name__ == "__main__":
    
    parser = argparse.ArgumentParser(description='Execute Semantic Foraging Code.')
    parser.add_argument('--bucket_name', type=str,  help='Name of google cloud bucket where data is stored')
    parser.add_argument('--prefix', type=str,  help='directory name in which the audio is stored in the bucket')
    parser.add_argument('--output_folder', type=str,  help='Path for output transcriptions to be stored')
    args = parser.parse_args()
    main(args.bucket_name, args.prefix, args.output_folder)