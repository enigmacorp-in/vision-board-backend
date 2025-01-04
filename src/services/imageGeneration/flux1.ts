import axios from 'axios';
import { ImageGenerationOptions, ImageGenerationResult, ImageGenerationService } from './types';

export class Flux1ImageGenerator implements ImageGenerationService {
  private PI_API_KEY: String;
  private sizeConfigs = {
    phone: {
      width: 1024,
      height: 1792,
    },
    laptop: {
      width: 1792,
      height: 1024,
    },
    normal: {
      width: 1024,
      height: 1024,
    }
  }
  private models = {
    schnell: 'Qubico/flux1-schnell',
    dev: 'Qubico/flux1-dev',
    advanced: 'Qubico/flux1-dev-advanced',
  }

  constructor() {
    if (!process.env.PI_API_KEY) {
      throw new Error("PI_API_KEY is not defined in the environment variables");
    }
    this.PI_API_KEY = process.env.PI_API_KEY;
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const sizeConfig = this.sizeConfigs[options.size];

    let data = JSON.stringify({
      "model": this.models.dev,
      "task_type": "txt2img",
      "input": {
        "prompt": options.prompt,
        "width": sizeConfig.width,
        "height": sizeConfig.height
      }
    })

    let config = {
      method: 'post',
      url: 'https://api.piapi.ai/api/v1/task',
      headers: {
        'X-API-Key': this.PI_API_KEY,
        'Content-Type': 'application/json'
      },
      data: data
    }

    let response = await axios(config as any);

    if(response.data.message !== 'success'){
      throw new Error("Failed to generate image");
    }

    let task_id = response.data.data.task_id;
    // this thing returns with a task_id

    let task_status = response.data.data.status;
    let task_result = null;
    while(task_status.toLowerCase() !== 'completed'){
      await new Promise(resolve => setTimeout(resolve, 1000));
      let result = await axios.get(`https://api.piapi.ai/api/v1/task/${task_id}`, {
        headers: {
          'X-API-Key': this.PI_API_KEY as any,
        }
      });
      task_status = result?.data?.data?.status;
      if(task_status.toLowerCase() === 'failed'){
        throw new Error("Failed to generate image");
      }
      task_result = result?.data;
    }

    let imageUrl = task_result?.data?.output?.image_url;
    if (!imageUrl) {
      throw new Error("Failed to generate image");
    }

    return {
      url: imageUrl,
      width: sizeConfig.width,
      height: sizeConfig.height
    };
  }
}