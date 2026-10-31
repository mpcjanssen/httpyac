import { log } from '../../io';
import * as models from '../../models';
import { replaceJavascriptExpressions } from './javascriptVariableReplacer';

describe('javascriptVariableReplacer', () => {
  describe('replaceJavascriptExpressions', () => {
    it('should return same value', async () => {
      const result = await replaceJavascriptExpressions('foo', 'unittest', {} as models.ProcessorContext);
      expect(result).toEqual('foo');
    });
    it('should return same value and do nothing', async () => {
      const result = await replaceJavascriptExpressions(23, 'unittest', {} as models.ProcessorContext);
      expect(result).toEqual(23);
    });
    it('should return replaced value', async () => {
      const result = await replaceJavascriptExpressions('foo{{foo}} {{foo}}', 'unittest', {
        variables: {
          foo: 'bar',
        },
        httpFile: {
          fileName: 'test',
        },
        httpRegion: {
          symbol: {
            startLine: 1,
          },
        },
      } as unknown as models.ProcessorContext);
      expect(result).toEqual('foobar bar');
    });
    it('should return replaced date value', async () => {
      const tested = new Date();
      const result = await replaceJavascriptExpressions('foo={{tested}}', 'unittest', {
        variables: {
          tested,
        },
        httpFile: {
          fileName: 'test',
        },
        httpRegion: {
          symbol: {
            startLine: 1,
          },
        },
      } as unknown as models.ProcessorContext);
      expect(result).toEqual(`foo=${tested.toISOString()}`);
    });
    it('should return replaced json value', async () => {
      const result = await replaceJavascriptExpressions('foo={{tested}}', 'unittest', {
        variables: {
          tested: {
            foo: 'bar',
          },
        },
        httpFile: {
          fileName: 'test',
        },
        httpRegion: {
          symbol: {
            startLine: 1,
          },
        },
      } as unknown as models.ProcessorContext);
      expect(result).toEqual(`foo={"foo":"bar"}`);
    });
    it('should return replaced nested value', async () => {
      const result = await replaceJavascriptExpressions('foo={{foo}}', 'unittest', {
        variables: {
          foo: '{{bar}}',
          bar: 'bar2',
        },
        httpFile: {
          fileName: 'test',
        },
        httpRegion: {
          symbol: {
            startLine: 1,
          },
        },
      } as unknown as models.ProcessorContext);
      expect(result).toEqual(`foo=bar2`);
    });
    it('should return replaced javascript expression', async () => {
      const result = await replaceJavascriptExpressions('foo={{1+2}}', 'unittest', {
        variables: {},
        httpFile: {
          fileName: 'test',
        },
        httpRegion: {
          symbol: {
            startLine: 1,
          },
        },
      } as unknown as models.ProcessorContext);
      expect(result).toEqual(`foo=3`);
    });
    it('should return non replaced value', async () => {
      jest.spyOn(log, 'trace').mockImplementation();
      const result = await replaceJavascriptExpressions(`foo={{bar}}`, models.VariableType.variable, {
        variables: {},
        httpFile: {
          fileName: 'test',
        },
        httpRegion: {
          symbol: {
            startLine: 1,
          },
        },
      } as unknown as models.ProcessorContext);
      expect(result).toEqual(`foo={{bar}}`);
    });
    it('should log full variable name when variable is not defined', async () => {
      const debugSpy = jest.spyOn(log, 'debug').mockImplementation();
      const result = await replaceJavascriptExpressions(`foo={{my-var}}`, models.VariableType.variable, {
        variables: {},
        httpFile: {
          fileName: 'test',
        },
        httpRegion: {
          symbol: {
            startLine: 1,
          },
        },
      } as unknown as models.ProcessorContext);
      expect(result).toEqual(`foo={{my-var}}`);
      expect(debugSpy).toHaveBeenCalledWith('variable my-var not defined');
      expect(debugSpy).not.toHaveBeenCalledWith(expect.objectContaining({ message: 'my is not defined' }));
      debugSpy.mockRestore();
    });
    it('should throw error with full name for undefined variable', async () => {
      await expect(
        replaceJavascriptExpressions(`http://{{my-name}}/`, models.VariableType.url, {
          variables: {},
          httpFile: {
            fileName: 'test',
          },
          httpRegion: {
            symbol: {
              startLine: 1,
            },
          },
        } as unknown as models.ProcessorContext)
      ).rejects.toThrow('my-name is not defined');
    });
    it('should still replace variables after an expression threw', async () => {
      const ctx = {
        variables: { foo: 'bar' },
        httpFile: { fileName: 'test' },
        httpRegion: { symbol: { startLine: 1 } },
      } as unknown as models.ProcessorContext;
      await expect(replaceJavascriptExpressions(`{{my-name}}`, models.VariableType.url, ctx)).rejects.toThrow();
      expect(await replaceJavascriptExpressions(`foo={{foo}}`, models.VariableType.url, ctx)).toEqual('foo=bar');
    });
    it('should throw error', async () => {
      jest.spyOn(log, 'error').mockImplementation();
      await expect(
        async () =>
          await replaceJavascriptExpressions(`foo={{bar}}`, 'unittest', {
            variables: {},
            httpFile: {
              fileName: 'test',
            },
            httpRegion: {
              symbol: {
                startLine: 1,
              },
            },
          } as unknown as models.ProcessorContext)
      ).rejects.toThrow();
    });
  });
});
