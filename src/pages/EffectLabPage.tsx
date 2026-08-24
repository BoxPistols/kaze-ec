import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { Link } from 'react-router-dom'

import { FormSelect } from '@/components/tw/FormSelect'
import {
  CAUSAL_SPEC,
  SCENARIOS,
  runScenario,
  type AnalysisResult,
} from '@/lib/causal'
import type { CheckStatus, EstimatorResult } from '@/lib/causal/types'

/**
 * 値下げの効果検証（出品ジャーニー 6）。
 *
 * **この画面が出すのは「値下げの効果はこう測る」であって、
 * 「あなたの出品では値下げが効く」ではない。** 前者は合成データで示せるが、
 * 後者には実ログが要る（design/journey-map.md）。
 *
 * 画面の主役は推定値ではなく、**推定値を出さない経路**。6 シナリオのうち
 * 2 つは分析不能で終わり、数字の代わりに「何があれば分析できるか」を返す
 */

const CONTAINER_SX = {
  maxWidth: 'md' as const,
  px: { xs: 2.5, sm: 3, md: 4 },
  py: { xs: 3, md: 5 },
}

const SCENARIO_OPTIONS = Object.values(SCENARIOS).map((s) => ({
  value: s.id,
  label: s.label,
}))

const STATUS_COLOR: Record<CheckStatus, 'success' | 'warning' | 'error'> = {
  pass: 'success',
  warn: 'warning',
  fail: 'error',
}

const STATUS_LABEL: Record<CheckStatus, string> = {
  pass: '合格',
  warn: '注意',
  fail: '不合格',
}

/** 率のポイント差として出す。0.062 → +6.2pt */
const pt = (v: number): string => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}pt`

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, mt: 4 }}>
    {children}
  </Typography>
)

const EstimatorRow = ({
  result,
  truth,
}: {
  result: EstimatorResult
  truth: number
}) => (
  <TableRow
    sx={{
      // 採用値だけ地色を変える。並べただけだと「どれを見ればいいか」が伝わらない
      bgcolor: (t) =>
        result.id === 'aipw' ? alpha(t.palette.primary.main, 0.06) : undefined,
    }}
  >
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ fontWeight: result.adopted ? 700 : 400 }}>
          {result.label}
        </Typography>
        {!result.adopted && (
          <Chip label="採用しない" size="small" color="warning" variant="outlined" />
        )}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {result.note}
      </Typography>
    </TableCell>
    <TableCell align="right">
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {pt(result.ATE)}
      </Typography>
    </TableCell>
    <TableCell align="right">
      <Typography variant="caption" color="text.secondary">
        {result.ci ? `${pt(result.ci[0])} 〜 ${pt(result.ci[1])}` : '算出できず'}
      </Typography>
    </TableCell>
    <TableCell align="right">
      <Typography variant="caption" color="text.secondary">
        {pt(result.ATE - truth)}
      </Typography>
    </TableCell>
  </TableRow>
)

/** SMD は 0.1 を超えると偏りが残っているとみなす慣行に従う */
const SMD_THRESHOLD = 0.1

const BalanceBar = ({ value }: { value: number }) => {
  const over = Math.abs(value) > SMD_THRESHOLD
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
      <Box
        sx={{
          width: 64,
          height: 6,
          borderRadius: 999,
          bgcolor: 'action.hover',
          overflow: 'hidden',
        }}
        aria-hidden
      >
        <Box
          sx={{
            width: `${Math.min(100, (Math.abs(value) / 0.5) * 100)}%`,
            height: '100%',
            bgcolor: over ? 'warning.main' : 'success.main',
          }}
        />
      </Box>
      <Typography variant="caption" color={over ? 'warning.main' : 'text.secondary'}>
        {value.toFixed(3)}
      </Typography>
    </Box>
  )
}

/** 分析不能のとき。**数字を一切出さず、何があれば分析できるかを返す** */
const BlockedPanel = ({ result }: { result: Extract<AnalysisResult, { status: 'blocked' }> }) => (
  <>
    <Alert severity="error" sx={{ mt: 3, borderRadius: 1.5 }}>
      <AlertTitle sx={{ fontWeight: 700 }}>このデータでは効果を推定しない</AlertTitle>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        品質検査に不合格があるため、推定を実行していません。
        条件を満たさないまま数字を出すと、その数字が独り歩きします。
      </Typography>
      <Box component="ul" sx={{ pl: 2.5, m: 0, listStyleType: 'disc' }}>
        {result.quality.reasons.map((r) => (
          <Typography component="li" variant="body2" key={r}>
            {r}
          </Typography>
        ))}
      </Box>
    </Alert>

    {result.quality.requiredData.length > 0 && (
      <Card variant="outlined" sx={{ mt: 2, borderRadius: 1.5, borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            何があれば分析できるか
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            「不足しています」で終わらせない。次に何を集めればいいかまで返す
          </Typography>
          <Box component="ul" sx={{ pl: 2.5, m: 0, listStyleType: 'disc' }}>
            {result.quality.requiredData.map((r) => (
              <Typography component="li" variant="body2" key={r} sx={{ mb: 0.5 }}>
                {r}
              </Typography>
            ))}
          </Box>
        </CardContent>
      </Card>
    )}
  </>
)

const OkPanel = ({ result }: { result: Extract<AnalysisResult, { status: 'ok' }> }) => (
  <>
    <SectionTitle>推定結果</SectionTitle>
    <Alert severity="info" variant="outlined" sx={{ mb: 1.5, borderRadius: 1.5 }}>
      <Typography variant="body2">
        真の効果は <strong>{pt(result.truth.ate)}</strong>。
        合成データなので答えが分かっており、各手法がそれをどれだけ回収できたかを
        並べて見られます。<strong>実データではこの列は作れません。</strong>
      </Typography>
    </Alert>
    <TableContainer component={Card} variant="outlined" sx={{ borderRadius: 1.5, borderColor: 'divider' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>手法</TableCell>
            <TableCell align="right">推定値</TableCell>
            <TableCell align="right">95% 区間</TableCell>
            <TableCell align="right">真値との差</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {result.results.map((r) => (
            <EstimatorRow key={r.id} result={r} truth={result.truth.ate} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
      区間はブートストラップ {result.settings.bootstrap} 回の percentile 法。
      回数がこの水準だと区間の端は数点で決まるため、幅は目安として読んでください。
      再標本の単位は出品者（同じ出品者の出品は独立ではないため）
    </Typography>

    <SectionTitle>診断</SectionTitle>
    <Card variant="outlined" sx={{ borderRadius: 1.5, borderColor: 'divider' }}>
      <CardContent>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              比較相手がいない出品
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {(result.diagnostics.outsideShare * 100).toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              傾向スコアが [0.05, 0.95] の外。多いと調整では救えない
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              E-value
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {result.diagnostics.eValue.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              観測していない要因がこの強さで効いていれば、結論は覆る
            </Typography>
          </Box>
        </Box>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>
          共変量のバランス（SMD）
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          調整前後で、値下げした群としなかった群の条件がどれだけ揃ったか。
          {SMD_THRESHOLD} 以下が目安
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>共変量</TableCell>
              <TableCell align="right">調整前</TableCell>
              <TableCell align="right">調整後</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {result.diagnostics.balance.map((b) => (
              <TableRow key={b.covariate}>
                <TableCell>
                  <Typography variant="body2">{b.covariate}</Typography>
                </TableCell>
                <TableCell align="right">
                  <BalanceBar value={b.smdBefore} />
                </TableCell>
                <TableCell align="right">
                  <BalanceBar value={b.smdAfter} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <SectionTitle>前提・限界・次にやること</SectionTitle>
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
      {(
        [
          ['この推定が成り立つ前提', result.assumptions, 'primary.main'],
          ['言えないこと', result.limitations, 'warning.main'],
          ['次にやること', result.nextSteps, 'success.main'],
        ] as const
      ).map(([title, items, color]) => (
        <Card
          key={title}
          variant="outlined"
          sx={{ borderRadius: 1.5, borderColor: 'divider', borderTop: 3, borderTopColor: color }}
        >
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {title}
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, m: 0, listStyleType: 'disc' }}>
              {items.map((s) => (
                <Typography component="li" variant="caption" key={s} sx={{ display: 'list-item', mb: 0.75 }}>
                  {s}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  </>
)

export const EffectLabPage = () => {
  const [scenarioId, setScenarioId] = useState('confounded')
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const scenario = useMemo(() => SCENARIOS[scenarioId], [scenarioId])

  useEffect(() => {
    // 推定は同期で 1 秒近くかかる。**そのまま呼ぶと最初の描画ごと止まる。**
    // 分析層を非同期化するのではなく、描画を先に通してから 1 回だけ譲る。
    // 決定性を保つため、計算自体は同期のまま触らない
    setResult(null)
    const id = window.setTimeout(() => setResult(runScenario(scenarioId)), 0)
    return () => window.clearTimeout(id)
  }, [scenarioId])

  return (
    <Container sx={CONTAINER_SX}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        値下げは成約につながるか
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        出品ジャーニー 6（値下げの判断）。
        この画面が答えるのは「値下げの効果はこう測る」であって、
        「あなたの出品では値下げが効く」ではありません。
      </Typography>

      <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
        <AlertTitle sx={{ fontWeight: 700 }}>ここに出る数字は合成データです</AlertTitle>
        <Typography variant="body2">
          真の効果が分かっている人工ログを生成し、推定手法がそれを回収できるかを
          検証しています。<strong>kaze-ec の実績ではありません。</strong>
          カタログの{' '}
          <Box component={Link} to="/" sx={{ color: 'inherit' }}>
            出品一覧
          </Box>{' '}
          とはデータソースが完全に別で、混ざりません。
        </Typography>
      </Alert>

      <SectionTitle>何を、どう比べるか</SectionTitle>
      <Card variant="outlined" sx={{ borderRadius: 1.5, borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            <strong>データを見る前に</strong>決めた定義。結果を見てから動かしません
          </Typography>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            {(
              [
                ['分析の単位', CAUSAL_SPEC.unit],
                ['施策', CAUSAL_SPEC.treatment],
                ['成果', `${CAUSAL_SPEC.outcome}（${CAUSAL_SPEC.timeWindow}）`],
                ['推定するもの', CAUSAL_SPEC.estimand],
              ] as const
            ).map(([k, v]) => (
              <Box key={k}>
                <Typography variant="caption" color="text.secondary">
                  {k}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {v}
                </Typography>
              </Box>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            条件を揃える共変量: {CAUSAL_SPEC.confounders.join(' / ')}
          </Typography>
        </CardContent>
      </Card>

      <SectionTitle>条件を変えて確かめる</SectionTitle>
      <Card variant="outlined" sx={{ borderRadius: 1.5, borderColor: 'divider' }}>
        <CardContent>
          <FormSelect
            label="シナリオ"
            value={scenarioId}
            options={SCENARIO_OPTIONS}
            onChange={(next) => next && setScenarioId(next)}
          />
          <Typography variant="body2" sx={{ mt: 2 }}>
            {scenario.description}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            確かめること: {scenario.expectation}
          </Typography>
        </CardContent>
      </Card>

      {result === null ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          推定しています…
        </Typography>
      ) : result.status === 'blocked' ? (
        <BlockedPanel result={result} />
      ) : (
        <OkPanel result={result} />
      )}

      {result !== null && (
        <>
          <SectionTitle>品質検査</SectionTitle>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            <strong>不合格が 1 つでもあれば推定を実行しません。</strong>
            数字を出さない経路を、出す経路より先に作っています
          </Typography>
          <TableContainer component={Card} variant="outlined" sx={{ borderRadius: 1.5, borderColor: 'divider' }}>
            <Table size="small">
              <TableBody>
                {result.quality.checks.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell sx={{ width: 96 }}>
                      <Chip
                        label={STATUS_LABEL[c.status]}
                        size="small"
                        color={STATUS_COLOR[c.status]}
                        variant={c.status === 'pass' ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {c.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.detail}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
            分析バージョン {result.version} / 乱数シード {result.settings.seed}
            {/* 分析不能のときはブートストラップを回していない。
                設定値だから出す、をやると回したように読める */}
            {result.status === 'ok' && ` / ブートストラップ ${result.settings.bootstrap} 回`}。
            同じシードなら何度実行しても同じ結果になります
          </Typography>
        </>
      )}

      <Box sx={{ mt: 4, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <Button component={Link} to="/mypage?tab=listings" variant="outlined" size="small">
          出品管理へ戻る
        </Button>
        <Button component={Link} to="/components" variant="text" size="small">
          使っている部品を見る
        </Button>
      </Box>
    </Container>
  )
}
