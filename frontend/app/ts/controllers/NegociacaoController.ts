import { Negociacao, Negociacoes } from '../models/index';
import { MensagemView, NegociacoesView } from '../views/index';
import { logarTempoDeExecucao, domInject, throttle } from '../helpers/decorators/index';
import { HandlerFunction, NegociacaoService } from '../service/index';
import { imprime } from '../helpers/index';

let timer = 0;

export class NegociacaoController {
  @domInject('#data')
  private _inputData: JQuery;
  
  @domInject('#quantidade')
  private _inputQuantidade: JQuery;
  
  @domInject('#valor')
  private _inputValor: JQuery;
  private _negociacoes = new Negociacoes();
  private _negociacoesView = new NegociacoesView('#negociacoesView');
  private _mensagemView = new MensagemView('#mensagemView');

  private _service = new NegociacaoService();

  constructor() {
    this._negociacoesView.update(this._negociacoes);
  }

  @throttle()
  @logarTempoDeExecucao(true)
  adiciona() {
    let data = new Date(this._inputData.val().replace(/-/g, ','));
    
    if (!this._ehDiaUtil(data)) {
      this._mensagemView.update('Somente negociações em dias úteis, por favor');
      return;
    }

    const negociacao = new Negociacao(
      data,
      parseInt(this._inputQuantidade.val()),
      parseFloat(this._inputValor.val())
    );

    imprime(negociacao);
    this._negociacoes.adiciona(negociacao);
    this._negociacoes.paraTexto();
    this._negociacoesView.update(this._negociacoes);
    this._mensagemView.update('Negociação adicionada com sucesso!');
  }

  private _ehDiaUtil(data: Date) {
    return data.getDay() != DiaDaSemana.Sabado 
    && data.getDay() != DiaDaSemana.Domingo;
  }

  @throttle()
  async importaDados() {
    const isOk: HandlerFunction = (res: Response) => {
      if (res.ok) return res;
      else throw new Error(res.statusText);
    }

    try {
      const negociacoesParaImportar = await this._service.obterNegociacoes(isOk);
      const negociacoesJaImportadas = this._negociacoes.paraArray();

      negociacoesParaImportar
        .filter(negociacao => 
          !negociacoesJaImportadas.some(jaImportada => 
            negociacao.ehIgual(jaImportada)
          ))
        .forEach(negociacao => 
        this._negociacoes.adiciona(negociacao));

      this._negociacoesView.update(this._negociacoes);
    } catch (err) {
      this._mensagemView.update(err.message);
    }
  }
}

enum DiaDaSemana {
  Domingo,
  Segunda,
  Terca,
  Quarta, 
  Quinta, 
  Sexta, 
  Sabado, 
}